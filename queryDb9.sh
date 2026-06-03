sudo docker exec postgres psql -U evolution -d evolution -c "SELECT name, (SELECT COUNT(*) FROM \"Contact\" WHERE \"instanceId\" = i.id) as contact_count FROM \"Instance\" i;"
