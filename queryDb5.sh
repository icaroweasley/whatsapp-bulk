sudo docker exec postgres psql -U evolution -d evolution -c "SELECT COUNT(*) FROM \"Contact\" WHERE \"remoteJid\" LIKE '55%@s.whatsapp.net';"
