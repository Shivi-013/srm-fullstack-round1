BFHL — SRM Full Stack Challenge (Next.js)
A single Next.js 14 project that ships both the REST API and the frontend.

Project Structure
bfhl-next/
├── app/
│   ├── api/
│   │   └── bfhl/
│   │       └── route.js        ← POST /api/bfhl handler
│   ├── layout.js
│   ├── globals.css
│   ├── page.js                 ← React frontend
│   └── page.module.css
├── lib/
│   └── processor.js            ← Core tree processing logic
├── package.json
└── next.config.js
Before you start — update identity fields
Open lib/processor.js and change lines 2–4:

export const USER_ID      = "yourname_ddmmyyyy";
export const EMAIL_ID     = "your.email@srmist.edu.in";
export const COLLEGE_ROLL = "RA2111XXXXXXX";
Local development
npm install
npm run dev
# → http://localhost:3000
# API → http://localhost:3000/api/bfhl
Deploy to Vercel (recommended — free)
npm i -g vercel
vercel --prod
Vercel auto-detects Next.js. No extra config needed.
Your API will be live at https://<your-app>.vercel.app/api/bfhl.

Submission URLs

Hosted API base URL: https://<your-app>.vercel.app (evaluator calls /api/bfhl)
Hosted frontend URL: https://<your-app>.vercel.app
API Reference
POST /api/bfhl
Request

{ "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello"] }
Response

{
  "user_id": "yourname_ddmmyyyy",
  "email_id": "you@srmist.edu.in",
  "college_roll_number": "RA2111XXXXXXX",
  "hierarchies": [
    { "root": "A", "tree": { "A": { "B": {}, "C": {} } }, "depth": 2 },
    { "root": "X", "tree": {}, "has_cycle": true }
  ],
  "invalid_entries": ["hello"],
  "duplicate_edges": [],
  "summary": { "total_trees": 1, "total_cycles": 1, "largest_tree_root": "A" }
}
Validation rules
Input	Result	Reason
A->B	✅ valid	Single uppercase letters
hello	❌ invalid	Not edge format
1->2	❌ invalid	Not uppercase letters
AB->C	❌ invalid	Multi-char parent
A-B	❌ invalid	Wrong separator
A->	❌ invalid	Missing child
A->A	❌ invalid	Self-loop
A->B	✅ valid	Trimmed before validation
Submission checklist
 Identity fields updated in lib/processor.js
 npm run build passes with no errors
 Deployed to Vercel (or another host)
 POST <url>/api/bfhl tested with the spec example
 GitHub repo is public
