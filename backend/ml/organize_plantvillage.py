import os
import shutil
from pathlib import Path

src = Path("scratch_pv/raw/color")
dest = Path("backend/ml/data_external/plantvillage")

print(f"Source exists: {src.exists()}")
print(f"Dest exists: {dest.exists()}")

dest.parent.mkdir(parents=True, exist_ok=True)

if src.exists():
    print(f"Moving {src} to {dest}...")
    shutil.move(str(src), str(dest))
    print("Move completed successfully.")
else:
    print("Source not found!")

# Clean up scratch_pv
if Path("scratch_pv").exists():
    print("Removing temporary scratch_pv directory...")
    # On Windows, git objects can be read-only, handle onerror
    def remove_readonly(func, path, exc_info):
        import stat
        os.chmod(path, stat.S_IWRITE)
        func(path)
    shutil.rmtree("scratch_pv", onerror=remove_readonly)
    print("Cleaned up scratch_pv.")

# Verify files in destination
if dest.exists():
    classes = [d for d in os.listdir(dest) if (dest / d).is_dir()]
    total_imgs = sum(len(files) for _, _, files in os.walk(dest))
    print(f"Destination verified: {len(classes)} classes, {total_imgs} images.")
