sudo docker exec postgres psql -U evolution -d evolution -c "SELECT \"remoteJid\", \"pushName\", \"profilePicUrl\" FROM \"Contact\" LIMIT 20;"
