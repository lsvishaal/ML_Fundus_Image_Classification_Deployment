from MLmodel.gradcam import GradCAM
from MLmodel.ModelDefenitions import ResNet_DINOv2_Hybrid
import cv2
from gloabal_vars import ML_MODEL_DIR

def load_model():
    device = "cuda"

    model = ResNet_DINOv2_Hybrid(num_classes=4)   # use exact same args
    model = model.to(device)

    state_dict = torch.load( ML_MODEL_DIR, map_location=device)
    model.load_state_dict(state_dict["model_state"])
    model.eval()
    target_layer = model.resnet[-1-1][-1]#type:ignore
    gradcam = GradCAM(model, target_layer)

    return model, device ,gradcam

def enable_gradcam(model):
    for p in model.resnet.parameters():
        p.requires_grad = True 



import torch
import cv2
import numpy as np
from PIL import Image

def infer_with_gradcam(
    image_path,
    model,
    gradcam,
    transform,
    device,
    class_names,
    save_path="gradcam_output.png"
):
    enable_gradcam(model)
    model.eval()

    # ---- Load original image ----
    original_img = Image.open(image_path).convert("RGB")
    original_np = np.array(original_img)

    # ---- Preprocess ----
    img = transform(original_img)
    img = img.unsqueeze(0).to(device)

    # ---- Pass 1: Prediction ----
    with torch.no_grad():
        output = model(img)
        pred_class = output.argmax(dim=1).item()
        confidence = torch.softmax(output, dim=1)[0, pred_class].item()

    # ---- Pass 2: Grad-CAM ----
    cam = gradcam.generate(img, pred_class)

    # ---- Resize original image to CAM size ----
    original_np = cv2.resize(original_np, (518, 518))

    # ---- Overlay ----
    heatmap = cv2.applyColorMap(np.uint8(255 * cam),cv2.COLORMAP_JET) # type: ignore

    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

    overlay = np.uint8(0.6 * original_np + 0.4 * heatmap)

    # ---- Save result ----
    cv2.imwrite(save_path, overlay) #type:ignore

    return {
        "predicted_class": class_names[pred_class],
        "confidence": round(confidence, 4),
        "gradcam_path": save_path
    }




class_names = [
    "Diabetic Retinopathy",
    "Glaucoma",
    "Healthy",
    "Myopia"
]


model, device,gradcam= load_model()
# result = infer_with_gradcam(
#     image_path=r"C:\Users\Vijay Anand\Documents\Programming\collegeProject\newDataset\Diabetic Retinopathy\DR49.jpg",
#     model=model,
#     gradcam=gradcam,
#     transform=inference_transforms,
#     device=device,
#     class_names=class_names,
#     save_path="sample_gradcam.png"
# )

# print(result)
