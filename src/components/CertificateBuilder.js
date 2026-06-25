import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, ImageRun, AlignmentType } from 'docx';
import './CertificateBuilder.css';

/* The PowerPoint slide is 600pt x 900pt. We render the certificate on a
   600 x 900 px stage so 1px == 1pt: every coordinate below is taken verbatim
   from the .pptx, so text spacing & placement match the deck exactly. */
// Star inner-radius ratios taken from the deck (star12 adj 0.432, star7 adj 0.410).
const STAR12 =
  'polygon(50.00% 0.00%, 61.18% 8.27%, 75.00% 6.70%, 80.55% 19.45%, 93.30% 25.00%, 91.73% 38.82%, 100.00% 50.00%, 91.73% 61.18%, 93.30% 75.00%, 80.55% 80.55%, 75.00% 93.30%, 61.18% 91.73%, 50.00% 100.00%, 38.82% 91.73%, 25.00% 93.30%, 19.45% 80.55%, 6.70% 75.00%, 8.27% 61.18%, 0.00% 50.00%, 8.27% 38.82%, 6.70% 25.00%, 19.45% 19.45%, 25.00% 6.70%, 38.82% 8.27%)';
const STAR7 =
  'polygon(50.00% 0.00%, 67.79% 13.06%, 89.09% 18.83%, 89.97% 40.88%, 98.75% 61.13%, 82.06% 75.56%, 71.69% 95.05%, 50.00% 91.00%, 28.31% 95.05%, 17.94% 75.56%, 1.25% 61.13%, 10.03% 40.88%, 10.91% 18.83%, 32.21% 13.06%)';

const RED = '#ea1b3c';
const DARK = '#231f20';

const CERT_TYPES = {
  pat: { label: 'Pat on the Back', title: 'PAT ON THE BACK', bg: 'cert-bg-pat.png', hasPhoto: true, team: false },
  star: { label: 'Star Performer', title: 'STAR PERFORMER', bg: 'cert-bg-star.png', hasPhoto: true, team: false },
  team: { label: 'Team Award', title: 'TEAM AWARD', bg: 'cert-bg-team.png', hasPhoto: false, team: true },
};

// Exact photo-frame geometry (pt) and shape per certificate type.
const PHOTO_FRAME = {
  pat: { x: 156, y: 158.4, w: 288, h: 280.5, clip: STAR12 },
  star: { x: 277.7, y: 128.3, w: 364.2, h: 354.7, clip: STAR7 },
};

// Exact team layouts (photo + name positions, pt) taken slide-by-slide from
// the deck — one arrangement per head-count, just like the PowerPoint.
const TEAM_LAYOUTS = {
  1: [{ px: 209.1, py: 181.1, pw: 181.8, ph: 186.7, nx: 223.5, ny: 378.7, nw: 153, nsz: 19 }],
  2: [
    { px: 86.9, py: 181.1, pw: 181.8, ph: 186.7, nx: 101.4, ny: 378.7, nw: 153, nsz: 19 },
    { px: 325.2, py: 181.1, pw: 181.8, ph: 186.7, nx: 339.7, ny: 378.7, nw: 153, nsz: 19 },
  ],
  3: [
    { px: 49.4, py: 181.1, pw: 158, ph: 162.2, nx: 49, ny: 350.9, nw: 143.3, nsz: 16 },
    { px: 394.3, py: 181.1, pw: 158, ph: 162.2, nx: 409, ny: 350.1, nw: 143.3, nsz: 16 },
    { px: 221.8, py: 227.1, pw: 158, ph: 162.2, nx: 229, ny: 398.1, nw: 143.3, nsz: 16 },
  ],
  4: [
    { px: 58, py: 187.1, pw: 104.9, ph: 107.7, nx: 60.3, ny: 301.3, nw: 96.8, nsz: 13 },
    { px: 437.1, py: 185.9, pw: 104.9, ph: 107.7, nx: 439.3, ny: 300.1, nw: 96.8, nsz: 13 },
    { px: 184.4, py: 245.1, pw: 104.9, ph: 107.7, nx: 186.6, ny: 359.3, nw: 96.8, nsz: 13 },
    { px: 310.7, py: 247.9, pw: 104.9, ph: 107.7, nx: 312.9, ny: 362.1, nw: 96.8, nsz: 13 },
  ],
  5: [
    { px: 90.9, py: 146.2, pw: 103.3, ph: 106, nx: 100.4, ny: 254.2, nw: 103.3, nsz: 13 },
    { px: 405.8, py: 146.2, pw: 103.3, ph: 106, nx: 415.3, ny: 254.2, nw: 103.3, nsz: 13 },
    { px: 246.2, py: 170.2, pw: 103.3, ph: 106, nx: 249.7, ny: 278.2, nw: 103.3, nsz: 13 },
    { px: 168.8, py: 323.7, pw: 103.3, ph: 106, nx: 178.3, ny: 429.7, nw: 103.3, nsz: 13 },
    { px: 327.2, py: 323.7, pw: 103.3, ph: 106, nx: 336.7, ny: 429.7, nw: 93.8, nsz: 13 },
  ],
  6: [
    { px: 101.7, py: 150.1, pw: 104.1, ph: 102.7, nx: 106.4, ny: 252.8, nw: 94.6, nsz: 13 },
    { px: 394.2, py: 150.1, pw: 104.1, ph: 102.7, nx: 399, ny: 252.8, nw: 94.6, nsz: 13 },
    { px: 247.9, py: 175, pw: 104.1, ph: 102.7, nx: 252.7, ny: 277.7, nw: 94.6, nsz: 13 },
    { px: 101.7, py: 311.4, pw: 104.1, ph: 102.7, nx: 106.4, ny: 414.1, nw: 94.6, nsz: 13 },
    { px: 394.2, py: 311.4, pw: 104.1, ph: 102.7, nx: 399, ny: 414.1, nw: 94.6, nsz: 13 },
    { px: 247.9, py: 336.4, pw: 104.1, ph: 102.7, nx: 252.7, ny: 439, nw: 94.6, nsz: 13 },
  ],
  7: [
    { px: 74, py: 155, pw: 84.3, ph: 86.6, nx: 75.4, ny: 241.5, nw: 84.3, nsz: 12 },
    { px: 441.7, py: 150.4, pw: 84.3, ph: 86.6, nx: 440.3, ny: 236.9, nw: 84.3, nsz: 12 },
    { px: 196.6, py: 180.4, pw: 84.3, ph: 86.6, nx: 194, ny: 266.9, nw: 84.3, nsz: 12 },
    { px: 319.1, py: 179, pw: 84.3, ph: 86.6, nx: 317.2, ny: 265.5, nw: 84.3, nsz: 12 },
    { px: 132.5, py: 322.8, pw: 84.3, ph: 86.6, nx: 133.9, ny: 409.3, nw: 84.3, nsz: 12 },
    { px: 383.2, py: 321.8, pw: 84.3, ph: 86.6, nx: 381.7, ny: 408.3, nw: 84.3, nsz: 12 },
    { px: 257.8, py: 347.2, pw: 84.3, ph: 86.6, nx: 257.8, ny: 433.7, nw: 84.3, nsz: 12 },
  ],
  10: [
    { px: 61.4, py: 168.4, pw: 84.3, ph: 86.6, nx: 61.4, ny: 254.9, nw: 84.3, nsz: 11 },
    { px: 256.1, py: 168.4, pw: 84.3, ph: 86.6, nx: 256.1, ny: 254.9, nw: 84.3, nsz: 11 },
    { px: 454.3, py: 168.4, pw: 84.3, ph: 86.6, nx: 454.3, ny: 254.9, nw: 84.3, nsz: 11 },
    { px: 158.5, py: 191, pw: 84.3, ph: 86.6, nx: 161.4, ny: 277.5, nw: 84.3, nsz: 11 },
    { px: 355.2, py: 191, pw: 84.3, ph: 86.6, nx: 355.2, ny: 277.5, nw: 84.3, nsz: 11 },
    { px: 61.4, py: 318.2, pw: 84.3, ph: 86.6, nx: 61.4, ny: 404.7, nw: 84.3, nsz: 11 },
    { px: 256.1, py: 317.2, pw: 84.3, ph: 86.6, nx: 256.1, ny: 403.7, nw: 84.3, nsz: 11 },
    { px: 454.3, py: 318.2, pw: 84.3, ph: 86.6, nx: 454.3, ny: 404.7, nw: 84.3, nsz: 11 },
    { px: 158.5, py: 340.8, pw: 84.3, ph: 86.6, nx: 161.4, ny: 427.3, nw: 84.3, nsz: 11 },
    { px: 355.2, py: 339.8, pw: 84.3, ph: 86.6, nx: 355.2, ny: 426.3, nw: 84.3, nsz: 11 },
  ],
};

// For head-counts the deck doesn't define (8, 9, 11+), build a centered,
// staggered grid in the same region/spirit as the deck slides.
const genTeamLayout = (n) => {
  const cols = n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
  const rows = Math.ceil(n / cols);
  const regionTop = 150;
  const regionH = 300;
  const ph = Math.min(106, (regionH - (rows - 1) * 18) / rows / 1.0);
  const pw = ph * 0.97;
  const colGap = 26;
  const rowGap = (regionH - rows * (ph + 28)) / Math.max(1, rows - 1);
  const nsz = n <= 9 ? 13 : 11;
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const inRow = Math.min(cols, n - r * cols);
    const rowW = inRow * pw + (inRow - 1) * colGap;
    const x0 = (600 - rowW) / 2;
    const c = i % cols;
    const px = x0 + c * (pw + colGap);
    const py = regionTop + r * (ph + 28 + Math.max(0, rowGap));
    out.push({ px, py, pw, ph, nx: px - 10, ny: py + ph + 4, nw: pw + 20, nsz });
  }
  return out;
};

// Parse a clip-path polygon("x% y%, ...") into [[fx,fy],...] fractions.
const polyPoints = (poly) =>
  poly
    .replace(/^polygon\(|\)$/g, '')
    .split(',')
    .map((pair) => pair.trim().split(/\s+/).map((v) => parseFloat(v) / 100));

// Mask an uploaded photo into the star shape (with zoom/pan baked in) so the
// export — html2canvas can't render CSS clip-path — still shows the star.
const maskStarPhoto = (src, frame, zoom, pos) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const S = 3;
      const W = frame.w * S;
      const H = frame.h * S;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      polyPoints(frame.clip).forEach(([fx, fy], i) => {
        const px = fx * W;
        const py = fy * H;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.clip();
      const cover = Math.max(W / img.width, H / img.height) * zoom;
      const dw = img.width * cover;
      const dh = img.height * cover;
      const dx = (W - dw) / 2 + pos.x * S;
      const dy = (H - dh) / 2 + pos.y * S;
      ctx.drawImage(img, dx, dy, dw, dh);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = src;
  });

const PILLARS = ['COMPASSION', 'INNOVATION', 'TRANSPARENCY', 'EXCELLENCE', 'OWNERSHIP'];

const DESKTOP_SCALE = 0.62; // preview shrink on desktop; export always captures full 600x900

const CertificateBuilder = () => {
  const [type, setType] = useState('pat');
  const [data, setData] = useState({
    recipientName: 'Ajay Kumar Mishra',
    teamName: 'ServiceNow Team',
    project: 'ServiceNow',
    pillar: 'COMPASSION',
    pillarTagline: 'Dedicated    •    Hardworking    •    Meticulous',
    date: 'July 2023',
    citation:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
  });
  const [members, setMembers] = useState([
    { name: 'Ajay Kumar Mishra', photo: '', dx: 0, dy: 0 },
    { name: 'Priya Sharma', photo: '', dx: 0, dy: 0 },
  ]);
  const [photo, setPhoto] = useState('');
  const [maskedPhoto, setMaskedPhoto] = useState('');
  const [photoZoom, setPhotoZoom] = useState(1);
  const [photoPos, setPhotoPos] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState('');
  const [scale, setScale] = useState(DESKTOP_SCALE); // responsive preview scale

  // Fit the 600x900 stage to the viewport width (phones included).
  useEffect(() => {
    const compute = () => {
      const target = Math.min(372, window.innerWidth - 48);
      setScale(Math.max(0.3, target / 600));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const certRef = useRef();
  const dragRef = useRef(null);
  const cfg = CERT_TYPES[type];

  // Re-bake the star-masked photo whenever the photo, framing or type changes.
  useEffect(() => {
    const frame = PHOTO_FRAME[type];
    if (!photo || !frame) {
      setMaskedPhoto('');
      return;
    }
    let cancelled = false;
    maskStarPhoto(photo, frame, photoZoom, photoPos).then((url) => {
      if (!cancelled) setMaskedPhoto(url);
    });
    return () => {
      cancelled = true;
    };
  }, [photo, photoZoom, photoPos, type]);

  const update = (e) => setData({ ...data, [e.target.name]: e.target.value });

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(ev.target.result);
      setPhotoZoom(1);
      setPhotoPos({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  // Single-photo drag (Pat / Star)
  const onPhotoDown = (e) => {
    if (!photo) return;
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    dragRef.current = { sx: p.clientX, sy: p.clientY, ...photoPos };
  };
  const onPhotoMove = (e) => {
    if (!dragRef.current) return;
    const p = e.touches ? e.touches[0] : e;
    setPhotoPos({
      x: dragRef.current.x + (p.clientX - dragRef.current.sx) / scale,
      y: dragRef.current.y + (p.clientY - dragRef.current.sy) / scale,
    });
  };
  const onPhotoUp = () => {
    dragRef.current = null;
  };
  const resetPhoto = () => {
    setPhotoZoom(1);
    setPhotoPos({ x: 0, y: 0 });
  };

  // Team members
  const updateMember = (i, field, value) =>
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  const handleMemberPhoto = (i, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateMember(i, 'photo', ev.target.result);
    reader.readAsDataURL(file);
  };
  const addMember = () => setMembers((prev) => [...prev, { name: '', photo: '', dx: 0, dy: 0 }]);
  const removeMember = (i) => setMembers((prev) => prev.filter((_, idx) => idx !== i));
  const resetLayout = () => setMembers((prev) => prev.map((m) => ({ ...m, dx: 0, dy: 0 })));

  const memberDrag = useRef(null);
  const onMemberDown = (i, e) => {
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    const m = members[i];
    memberDrag.current = { i, sx: p.clientX, sy: p.clientY, ox: m.dx || 0, oy: m.dy || 0 };
  };
  const onMemberMove = (e) => {
    if (memberDrag.current == null) return;
    const p = e.touches ? e.touches[0] : e;
    const { i, sx, sy, ox, oy } = memberDrag.current;
    const nx = ox + (p.clientX - sx) / scale;
    const ny = oy + (p.clientY - sy) / scale;
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, dx: nx, dy: ny } : m)));
  };
  const onMemberUp = () => {
    memberDrag.current = null;
  };

  /* ---------------- downloads ---------------- */
  const safeName = () =>
    `${(data.recipientName || data.teamName || 'InfoBeans').trim().replace(/\s+/g, '_')}_${cfg.label.replace(/\s+/g, '_')}`;

  const renderCanvas = async () =>
    html2canvas(certRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false });

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPNG = async () => {
    setBusy('png');
    try {
      const canvas = await renderCanvas();
      canvas.toBlob((b) => downloadBlob(b, `${safeName()}.png`));
    } finally {
      setBusy('');
    }
  };

  const downloadPDF = async () => {
    setBusy('pdf');
    try {
      const canvas = await renderCanvas();
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = 210, pageH = 297;
      const ratio = canvas.width / canvas.height;
      let w = pageW, h = pageW / ratio;
      if (h > pageH) { h = pageH; w = pageH * ratio; }
      pdf.addImage(img, 'PNG', (pageW - w) / 2, (pageH - h) / 2, w, h);
      pdf.save(`${safeName()}.pdf`);
    } finally {
      setBusy('');
    }
  };

  const dataUrlToBytes = (dataUrl) => {
    const bin = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  };

  const downloadDOCX = async () => {
    setBusy('docx');
    try {
      const canvas = await renderCanvas();
      const bytes = dataUrlToBytes(canvas.toDataURL('image/png'));
      const doc = new Document({
        sections: [
          {
            properties: { page: { margin: { top: 360, bottom: 360, left: 360, right: 360 } } },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new ImageRun({ data: bytes, transformation: { width: 600, height: 900 } })],
              }),
            ],
          },
        ],
      });
      downloadBlob(await Packer.toBlob(doc), `${safeName()}.docx`);
    } finally {
      setBusy('');
    }
  };

  /* ---------------- positioned text helper ---------------- */
  // weight: 300 = Lexend Light, 400 = Lexend, 700 = Lexend Bold
  const Box = ({ x, y, w, size, color = DARK, weight = 400, align = 'center', lh = 1.15, children }) => (
    <div
      className="cb"
      style={{
        left: x, top: y, width: w, fontSize: size, color,
        fontWeight: weight, textAlign: align, lineHeight: lh,
      }}
    >
      {children}
    </div>
  );

  const Tagline = ({ text }) =>
    text.split(/(•)/).map((p, i) =>
      p === '•' ? (
        <span key={i} style={{ color: RED }}>•</span>
      ) : (
        <span key={i}>{p}</span>
      )
    );

  // Single star photo (Pat / Star). The star mask is baked into a PNG so it
  // survives the html2canvas export; corners are transparent.
  const PhotoStar = ({ x, y, w, h, clip }) => (
    <div
      className={`cb photo-frame ${photo ? 'draggable' : ''}`}
      style={{ left: x, top: y, width: w, height: h }}
      onMouseDown={onPhotoDown}
      onMouseMove={onPhotoMove}
      onMouseUp={onPhotoUp}
      onMouseLeave={onPhotoUp}
      onTouchStart={onPhotoDown}
      onTouchMove={onPhotoMove}
      onTouchEnd={onPhotoUp}
    >
      {maskedPhoto ? (
        <img src={maskedPhoto} alt="recipient" draggable={false} style={{ width: '100%', height: '100%' }} />
      ) : (
        <span className="photo-ph" style={{ clipPath: clip, WebkitClipPath: clip }}>Photo</span>
      )}
    </div>
  );

  /* ---------------- the certificate (exact PPT coordinates) ---------------- */
  const renderCertificate = () => {
    if (type === 'pat') {
      return (
        <>
          <Box x={99} y={33.6} w={402} size={32} weight={700} color={RED}>PAT ON THE BACK</Box>
          <Box x={223.5} y={86.8} w={153} size={20} weight={300}>{data.date}</Box>
          <PhotoStar x={156} y={158.4} w={288} h={280.5} clip={STAR12} />
          <Box x={122} y={439.6} w={356} size={28} weight={400}>{data.recipientName}</Box>
          <Box x={223.5} y={480.3} w={153} size={16} weight={300}>{data.project}</Box>
          <Box x={67.2} y={526.3} w={465.5} size={16} weight={300} lh={1.15}>{data.citation}</Box>
          <Box x={122} y={640} w={356} size={22} weight={300}>Reflects our culture pillar</Box>
          <Box x={122} y={674} w={356} size={30} weight={300} color={RED}>{data.pillar}</Box>
          <Box x={110.1} y={732.5} w={379.7} size={16} weight={300}><Tagline text={data.pillarTagline} /></Box>
        </>
      );
    }
    if (type === 'star') {
      return (
        <>
          <Box x={38} y={52.1} w={318.5} size={44} weight={700} color={RED} align="left" lh={1.0}>STAR PERFORMER</Box>
          <PhotoStar x={277.7} y={128.3} w={364.2} h={354.7} clip={STAR7} />
          <Box x={38} y={163.1} w={153} size={20} weight={300} align="left">{data.date}</Box>
          <Box x={38} y={277.6} w={222.4} size={32} weight={400} align="left">{data.recipientName}</Box>
          <Box x={38} y={367.9} w={153} size={16} weight={300} align="left">{data.project}</Box>
          <Box x={38} y={425.1} w={290.8} size={16} weight={300} align="left" lh={1.15}>{data.citation}</Box>
          <Box x={38} y={557} w={356} size={22} weight={300} align="left">Reflects our culture pillar</Box>
          <Box x={38} y={591.1} w={356} size={30} weight={300} color={RED} align="left">{data.pillar}</Box>
          <Box x={38} y={643.6} w={379.7} size={16} weight={300} align="left"><Tagline text={data.pillarTagline} /></Box>
        </>
      );
    }
    // team
    return (
      <>
        <Box x={122} y={34.1} w={356} size={38} weight={700} color={RED}>TEAM AWARD</Box>
        <Box x={223.5} y={86.8} w={153} size={20} weight={300}>{data.date}</Box>
        {renderTeamMembers()}
        <Box x={190.7} y={493} w={218.6} size={20} weight={300}>{data.teamName}</Box>
        <Box x={75.9} y={532.3} w={448.1} size={15} weight={300} lh={1.15}>{data.citation}</Box>
        <Box x={122} y={639.9} w={356} size={21} weight={300}>Reflects our culture pillar</Box>
        <Box x={122} y={674} w={356} size={29} weight={300} color={RED}>{data.pillar}</Box>
        <Box x={110.1} y={726.5} w={379.7} size={15} weight={300}><Tagline text={data.pillarTagline} /></Box>
      </>
    );
  };

  // Team photos + names placed at the EXACT per-head-count positions from the
  // deck (slides 3–9 → counts 2–7 and 10); other counts use a matching grid.
  const renderTeamMembers = () => {
    const n = members.length;
    const layout = TEAM_LAYOUTS[n] || genTeamLayout(n);
    return members.map((m, i) => {
      const p = layout[i] || layout[layout.length - 1];
      const dx = m.dx || 0;
      const dy = m.dy || 0;
      const radius = Math.min(p.pw, p.ph) * 0.1667;
      return (
        <React.Fragment key={i}>
          <div
            className="team-photo-abs draggable"
            style={{ left: p.px + dx, top: p.py + dy, width: p.pw, height: p.ph, borderRadius: radius }}
            onMouseDown={(e) => onMemberDown(i, e)}
            onTouchStart={(e) => onMemberDown(i, e)}
          >
            {m.photo ? (
              <img src={m.photo} alt={m.name} draggable={false} />
            ) : (
              <span className="team-photo-ph">{(m.name || '?').charAt(0)}</span>
            )}
          </div>
          <div
            className="cb team-name-abs draggable"
            style={{ left: p.nx + dx, top: p.ny + dy, width: p.nw, fontSize: p.nsz, fontWeight: 300, textAlign: 'center', lineHeight: 1.15 }}
            onMouseDown={(e) => onMemberDown(i, e)}
            onTouchStart={(e) => onMemberDown(i, e)}
          >
            {m.name}
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="cert-builder">
      {/* ---------------- Form ---------------- */}
      <div className="cert-form">
        <div className="form-section">
          <h2>Certificate Type</h2>
          <div className="type-grid">
            {Object.entries(CERT_TYPES).map(([key, c]) => (
              <button
                key={key}
                type="button"
                className={`type-card ${type === key ? 'active' : ''}`}
                onClick={() => setType(key)}
              >
                <span className="type-emoji">{key === 'team' ? '👥' : key === 'star' ? '⭐' : '👏'}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h2>Details</h2>

          {cfg.team ? (
            <>
              <div className="form-group">
                <label>Team Members ({members.length}) — name &amp; photo each</label>
                <div className="member-list">
                  {members.map((m, i) => (
                    <div className="member-row" key={i}>
                      <span className="member-idx">{i + 1}</span>
                      <input
                        className="member-name"
                        value={m.name}
                        placeholder={`Member ${i + 1} name`}
                        onChange={(e) => updateMember(i, 'name', e.target.value)}
                      />
                      <label className={`member-photo-btn ${m.photo ? 'has' : ''}`}>
                        {m.photo ? '✅' : '📷'}
                        <input type="file" accept="image/*" onChange={(e) => handleMemberPhoto(i, e)} />
                      </label>
                      {members.length > 1 && (
                        <button type="button" className="member-remove" onClick={() => removeMember(i)} title="Remove">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="team-actions">
                  <button type="button" className="add-member" onClick={addMember}>+ Add member</button>
                  <button type="button" className="reset-photo" onClick={resetLayout}>Reset layout</button>
                </div>
                <p className="drag-hint">Tip: drag any photo + name in the preview to reposition it.</p>
              </div>
              <div className="form-group">
                <label>Team Name</label>
                <input name="teamName" value={data.teamName} onChange={update} />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Recipient Name</label>
                <input name="recipientName" value={data.recipientName} onChange={update} />
              </div>
              <div className="form-group">
                <label>Project / Team</label>
                <input name="project" value={data.project} onChange={update} />
              </div>
            </>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Culture Pillar</label>
              <input name="pillar" value={data.pillar} onChange={update} list="pillar-list" />
              <datalist id="pillar-list">
                {PILLARS.map((p) => (<option key={p} value={p} />))}
              </datalist>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input name="date" value={data.date} onChange={update} />
            </div>
          </div>

          <div className="form-group">
            <label>Pillar Tagline</label>
            <input name="pillarTagline" value={data.pillarTagline} onChange={update} />
          </div>

          <div className="form-group">
            <label>Citation / Description</label>
            <textarea name="citation" value={data.citation} onChange={update} rows="4" />
          </div>

          {cfg.hasPhoto && (
            <div className="form-group">
              <label>Recipient Photo</label>
              <input type="file" accept="image/*" onChange={handlePhoto} />
              {photo && (
                <div className="photo-adjust">
                  <p className="photo-ok">✅ Photo added — drag it in the preview to reposition</p>
                  <label className="zoom-label">
                    Zoom
                    <input type="range" min="1" max="3" step="0.01" value={photoZoom}
                      onChange={(e) => setPhotoZoom(parseFloat(e.target.value))} />
                  </label>
                  <button type="button" className="reset-photo" onClick={resetPhoto}>Reset position &amp; zoom</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>Download</h2>
          <div className="download-row">
            <button className="dl-btn" disabled={busy} onClick={downloadPNG}>{busy === 'png' ? '…' : '🖼️ Image (PNG)'}</button>
            <button className="dl-btn" disabled={busy} onClick={downloadPDF}>{busy === 'pdf' ? '…' : '📄 PDF'}</button>
            <button className="dl-btn" disabled={busy} onClick={downloadDOCX}>{busy === 'docx' ? '…' : '📝 Word (DOCX)'}</button>
          </div>
        </div>
      </div>

      {/* ---------------- Live preview (exact PPT layout) ---------------- */}
      <div className="cert-preview-wrap">
        <div className="cert-stage-box" style={{ width: 600 * scale, height: 900 * scale }}>
          <div className="cert-stage" style={{ transform: `scale(${scale})` }}>
            <div
              className={`certificate cert-${type}`}
              ref={certRef}
              style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/${cfg.bg})` }}
              onMouseMove={onMemberMove}
              onMouseUp={onMemberUp}
              onMouseLeave={onMemberUp}
              onTouchMove={onMemberMove}
              onTouchEnd={onMemberUp}
            >
              {renderCertificate()}
            </div>
          </div>
        </div>
        <p className="cert-hint">Live preview — laid out exactly like the InfoBeans deck. Download as Image, PDF or Word.</p>
      </div>
    </div>
  );
};

export default CertificateBuilder;
