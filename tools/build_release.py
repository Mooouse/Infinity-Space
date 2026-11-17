"""Package the fixed release; source and tests never enter the playable payload."""
from pathlib import Path
import shutil,zipfile
root=Path(__file__).resolve().parents[1];dest=root/'dist';dest.mkdir(exist_ok=True)
for pattern in ('*.html','*.js','*.css','*.svg'):
 for p in root.glob(pattern):
  if p.name!='ui-v15-bridge.inc.js':shutil.copy2(p,dest/p.name)
shutil.copytree(root/'assets',dest/'assets',dirs_exist_ok=True)
with zipfile.ZipFile(root/'infinity-space-crazygames.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(dest.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(dest))
assert (root/'infinity-space-crazygames.zip').stat().st_size<20_000_000
print('Release bytes:',(root/'infinity-space-crazygames.zip').stat().st_size)
