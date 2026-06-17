# isoc-last

> [!NOTE]
> init.sql only run if /var/lib/mysql is empty (on first run)
> mariadb has a annonymous volume mapped to /var/lib/myssql, so we have to run
> docker compose down -v # to recreate the db and trigger the init.sql scripts

- Frontend at `localhost:5137`
- Services `auth`, `bug`, `notification`, `project` at ports `8001`, `8002`, `8003`, `8004`  
- Databases in the same order: `3307`, `3308`, `3309`, `3310`

### NGROK
- `ngrok http --url=preanaphoral-christena-babblingly.ngrok-free.dev 3157`

### REACT
- Ideal da format la fisiere inainte de commit: `npx prettier --write "src/**/*.tsx"`

### CERT TRUST
- Suboptim, dar ok pentru dev
```
sudo cp ca.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates

# ARCH
sudo trust anchor /path/to/certificate.crt
```
