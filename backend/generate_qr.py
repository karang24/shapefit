import qrcode
import uuid
from pathlib import Path
from datetime import datetime

def generate_coach_qr():
    token = f"COACH-{uuid.uuid4().hex[:8]}-{datetime.now().strftime('%Y%m%d')}"
    backend_root = Path(__file__).resolve().parent
    qr_dir = backend_root / "coach_qr"
    qr_dir.mkdir(parents=True, exist_ok=True)
    qr_path = qr_dir / "coach_qr.png"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(token)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(qr_path)
    
    print(f"QR Code saved as '{qr_path}'")
    print(f"Token: {token}")
    print("\nScan this QR code with the mobile app to start a session!")

if __name__ == "__main__":
    print("Generating Coach QR Code...")
    generate_coach_qr()
