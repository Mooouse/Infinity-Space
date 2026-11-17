"""Reproducible original instrumental soundtrack and hand-built SVG artwork.
Requires Python, numpy and ffmpeg. No samples or external compositions.
"""
from pathlib import Path
import json, math, subprocess, tempfile
import numpy as np
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'assets/music';OUT.mkdir(parents=True,exist_ok=True)
titles=['Velvet Orbit','Crimson Aphelion','Glass Satellites','Solar Petals','Violet Current','Quiet Meridian','Ember Constellation','Gravity Waltz','Golden Parallax','Midnight Signals','Stellar Garden','Beyond the Halo']
colors=['#7444ff','#ff305b','#427aff','#ffd52b','#9d41ff','#315cff','#ff4935','#ba35ff','#ffce32','#385cff','#44ef63','#9d4dff']
manifest=json.loads((ROOT/'music-tracks.js').read_text().split('=',1)[1].strip().rstrip(';'))
SR=32000
for idx,track in enumerate(manifest):
 rng=np.random.default_rng(13019+idx);beat=60/(72+idx*3);bar=beat*4;duration=bar*32
 n=int(duration*SR);mix=np.zeros((n,2),np.float32)
 root=[45,48,50,43,47,41,46,45,48,42,50,44][idx]
 progressions=[[0,5,3,7],[0,3,7,5],[0,7,5,3]][idx%3]
 def voice(start,length,note,amp,kind,pan=0):
  a=int(start*SR);size=min(int(length*SR),n-a)
  if size<=0:return
  t=np.arange(size)/SR;f=440*2**((note-69)/12)
  if kind=='pad':
   sig=(np.sin(2*np.pi*f*t)+.32*np.sin(2*np.pi*f*1.003*t)+.16*np.sin(2*np.pi*f*2*t))
   env=np.minimum(t/.8,1)*np.minimum((length-t)/1.6,1)*(.88+.12*np.sin(t*1.3))
  elif kind=='bell':
   sig=np.sin(2*np.pi*f*t+.6*np.sin(2*np.pi*f*2*t)*np.exp(-t*3))+.18*np.sin(2*np.pi*f*3*t)*np.exp(-t*5)
   env=(1-np.exp(-t*65))*np.exp(-t/(.8+idx*.03))*np.minimum((length-t)/.1,1)
  elif kind=='bass':
   sig=np.sin(2*np.pi*f*t)+.12*np.sin(2*np.pi*f*2*t);env=np.minimum(t/.03,1)*np.exp(-t/1.1)*np.minimum((length-t)/.1,1)
  else:
   sig=np.sin(2*np.pi*(48*t+6*(1-np.exp(-t*24))));env=np.exp(-t*12)*np.minimum(t/.005,1)
  env=np.maximum(0,env);sig=(sig*env*amp).astype(np.float32)
  mix[a:a+size,0]+=sig*np.sqrt((1-pan)/2);mix[a:a+size,1]+=sig*np.sqrt((1+pan)/2)
 for b in range(32):
  chord=root+progressions[(b//2)%4];section=(b//8)%4
  for j,interval in enumerate([0,3 if idx%3!=1 else 4,7,14]):voice(b*bar,bar*1.4,chord+12+interval,.065,'pad',(j-1.5)*.3)
  for step in range(8):
   if (step+b+idx)%5==0:continue
   note=chord+24+[0,7,12,3,14,7,10,3][(step+idx+section)%8]
   voice(b*bar+step*beat/2,beat*2.8,note,.075 if section!=1 else .045,'bell',math.sin(step+idx)*.65)
  for step in [0,2]:voice(b*bar+step*beat,beat*1.8,chord-12,.14,'bass')
  if idx%3!=0 and 4<=b<28:
   for step in [0,2]:voice(b*bar+step*beat,.6,0,.11,'kick')
 # Stereo echo; smooth intro/outro and headroom without clipping.
 dry=mix.copy()
 for delay,gain in [(beat*.75,.22),(beat*1.5,.12),(beat*2.25,.065)]:
  shift=int(delay*SR);mix[shift:]+=dry[:-shift,::-1]*gain
 fade=np.minimum(np.arange(n)/(SR*2.5),1)*np.minimum((n-1-np.arange(n))/(SR*4),1)
 mix*=fade[:,None];peak=float(np.max(np.abs(mix)));mix*=.86/max(peak,.001)
 pcm=(mix*32767).astype('<i2')
 target=OUT/f'track-{idx+1:02}.mp3'
 subprocess.run(['ffmpeg','-v','error','-y','-f','s16le','-ar',str(SR),'-ac','2','-i','pipe:0','-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',str(target)],input=pcm.tobytes(),check=True)
 track.update(title=titles[idx],duration=round(duration,2),cover=f'assets/music/track-{idx+1:02}.svg',subtitle=['Ambient · drifting chords','Electronic · orbital pulse','Space keys · soft echoes'][idx%3])
 color=colors[idx];angle=idx*17-42
 stars=''.join(f'<circle cx="{int(rng.integers(24,488))}" cy="{int(rng.integers(24,430))}" r="{rng.choice([1,1.5,2])}" fill="#fff" opacity="{rng.uniform(.3,.9):.2f}"/>' for _ in range(75))
 rings=''.join(f'<ellipse cx="256" cy="237" rx="{130+j*25}" ry="{42+j*12}" transform="rotate({angle+j*12} 256 237)" fill="none" stroke="{color}" stroke-width="{2 if j else 6}" opacity="{.9-j*.19}"/>' for j in range(4))
 shape=[f'<circle cx="256" cy="237" r="83" fill="url(#planet)"/><path d="M190 245Q245 192 324 222" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="5"/>',f'<path d="M256 124 335 237 256 350 177 237Z" fill="url(#planet)"/><path d="m256 124 0 226M177 237h158" stroke="#fff" stroke-opacity=".5" fill="none"/>',f'<circle cx="256" cy="237" r="76" fill="#070511" stroke="{color}" stroke-width="8"/><circle cx="256" cy="237" r="94" fill="none" stroke="{color}" stroke-width="2"/>'][idx%3]
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="bg"><stop stop-color="{color}" stop-opacity=".32"/><stop offset="1" stop-color="#070511"/></radialGradient><linearGradient id="planet" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".25" stop-color="{color}"/><stop offset="1" stop-color="#120723"/></linearGradient></defs><rect width="512" height="512" fill="#070511"/><rect width="512" height="512" fill="url(#bg)"/>{stars}{rings}{shape}<text x="32" y="45" fill="#fff" font-family="sans-serif" font-size="12" letter-spacing="4">INFINITY SPACE / {idx+1:02}</text><text x="32" y="469" fill="#fff" font-family="sans-serif" font-size="25" font-weight="600">{titles[idx]}</text><path d="M32 487h448" stroke="{color}" stroke-width="3"/></svg>'''
 (OUT/f'track-{idx+1:02}.svg').write_text(svg)
 print(idx+1,titles[idx],round(duration,1),target.stat().st_size,flush=True)
for p in OUT.glob('*.jpg'):p.unlink()
(ROOT/'music-tracks.js').write_text('window.SpaceMusicTracks = '+json.dumps(manifest,ensure_ascii=False,indent=2)+';\n')
