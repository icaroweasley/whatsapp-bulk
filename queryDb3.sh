sudo docker exec postgres psql -U evolution -d evolution -c "SELECT \"remoteJid\", \"pushName\" FROM \"Contact\" WHERE \"remoteJid\" LIKE '%@s.whatsapp.net' LIMIT 10;"
