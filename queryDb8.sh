sudo docker exec postgres psql -U evolution -d evolution -c "SELECT \"pushName\", \"remoteJid\", \"instanceId\" FROM \"Contact\" WHERE \"remoteJid\" LIKE '%556791428298%';"
