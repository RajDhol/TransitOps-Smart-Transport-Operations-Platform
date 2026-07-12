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
  "email": "manager@transitops.com",
  "password": "securepassword123"
}
```

The API creates `transitops.db` locally from `schema.sql` and `seed_data.sql` on startup. The supplied seed password hashes are placeholders, so every seeded development account is initialized with `securepassword123`.
