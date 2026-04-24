# BFHL Full Stack Challenge

A polished full-stack implementation of the SRM BFHL challenge.

- **Backend:** Node.js + Express
- **Frontend:** React + Vite
- **Deployment:** Render for API, Vercel for UI

## What it does

This project accepts an array of node-style strings like:

```json
{
  "data": ["A->B", "A->C", "B->D", "hello", "A->B"]
}
```

It returns a structured response with:

- identity fields
- hierarchy trees
- cycle detection
- invalid entries
- duplicate edges
- summary stats

## Live flow

1. Paste edge data into the frontend.
2. The UI calls `POST /bfhl`.
3. The backend validates, builds hierarchies, detects cycles, and returns JSON.
4. The frontend renders the response as readable cards and tree views.

## Project Structure

```text
bajaj-fs/
├── backend/
│   ├── server.js
│   ├── bfhl.js
│   ├── constants.js
│   └── package.json
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── render.yaml
└── DEPLOYMENT.md
```

## Local Development

### Backend

```powershell
cd backend
npm install
npm start
```

Backend runs on:
- `http://localhost:3000`
- `POST /bfhl`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

By default, the frontend points to:
- `http://localhost:3000/bfhl`

If needed, set:

```bash
VITE_API_URL=http://localhost:3000/bfhl
```

## Example API Request

```json
{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->X", "hello", "A->B"]
}
```

## Example Response Shape

```json
{
  "user_id": "...",
  "email_id": "...",
  "college_roll_number": "...",
  "hierarchies": [],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 0,
    "total_cycles": 0,
    "largest_tree_root": ""
  }
}
```

## Notes

- The backend expects `POST /bfhl` with JSON content type.
- The frontend is responsive and optimized for evaluator review.
- Keep `USER_ID`, `EMAIL_ID`, and `COLLEGE_ROLL_NUMBER` set correctly before submission.

## Demo Mindset

The goal here is not just to pass the API test. It is to make the result easy to inspect quickly, which is why the UI emphasizes:

- clean hierarchy cards
- summary metrics
- filtered views
- raw JSON access when needed

## Useful Links

- [Backend API](backend)
- [Frontend app](frontend)
