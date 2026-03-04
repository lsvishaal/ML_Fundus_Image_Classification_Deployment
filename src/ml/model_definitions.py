import torch
import torch.nn as nn
import torchvision.models as models
from torchvision.models import ResNet50_Weights
import timm


class ResNet_DINOv2_Hybrid(nn.Module):
    def __init__(self, num_classes=4):
        super().__init__()

        # 1. ResNet50 backbone (FROZEN)
        resnet = models.resnet50(weights=ResNet50_Weights.DEFAULT)
        for param in resnet.parameters():
            param.requires_grad = False

        # Remove avgpool and fc → keep spatial feature map
        self.resnet = nn.Sequential(*list(resnet.children())[:-2])
        # Output: [B, 2048, ~16, ~16] for 518x518 input

        # 2. Projection layer (2048 → 384)

        self.proj = nn.Linear(2048, 384)

        # 3. DINOv2 ViT-small with registers

        self.vit = timm.create_model(
            "vit_small_patch14_reg4_dinov2.lvd142m",
            pretrained=True,
            num_classes=0,  # removes classification head
        )

        # 4. Final classifier
        self.classifier = nn.Linear(384, num_classes)

    def forward(self, x):
        # ResNet feature extraction
        feats = self.resnet(x)
        # [B, 2048, H, W] ≈ [B, 2048, 16, 16]

        B, C, H, W = feats.shape

        # Convert feature map to tokens
        tokens = feats.flatten(2).permute(0, 2, 1)
        # [B, H*W, 2048] → [B, 256, 2048]

        # Project to ViT embedding
        tokens = self.proj(tokens)
        # [B, 256, 384]

        # Class token
        cls_token = self.vit.cls_token.expand(B, -1, -1)  # type: ignore

        # Register tokens (DINOv2 specific)
        reg_tokens = self.vit.reg_token.expand(B, -1, -1)  # type: ignore

        # Concatenate: [CLS][REG][PATCH TOKENS]
        x = torch.cat((cls_token, reg_tokens, tokens), dim=1)

        # Add positional embeddings
        x = x + self.vit.pos_embed[:, : x.size(1), :]  # type: ignore
        x = self.vit.pos_drop(x)  # type: ignore

        # Transformer blocks
        for blk in self.vit.blocks:  # type: ignore
            x = blk(x)

        x = self.vit.norm(x)  # type: ignore

        # Take CLS token output
        vit_out = x[:, 0]

        # ---- Classification ----
        out = self.classifier(vit_out)
        return out
