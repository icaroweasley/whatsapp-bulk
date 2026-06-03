sudo docker exec postgres psql -U evolution -d evolution -c "SELECT id, name, \"connectionStatus\" FROM \"Instance\";"
