# TransitOps authentication API

Install the dependencies and run the API from the repository root:

```powershell
py -m pip install -r backend/requirements.txt
$env:JWT_SECRET = "replace-with-a-long-random-secret"
py -m uvicorn backend.main:app --reload --port 8000
```

`POST http://localhost:8000/api/auth/login`

```json
{
  "email": "robert.miller@transitops.com",
  "password": "<the plaintext password matching the seed hash>"
}
```

The API creates `transitops.db` locally from `schema.sql` and `seed_data.sql` on startup without modifying the seeded data.
