DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'bistro_user') THEN
      CREATE ROLE bistro_user LOGIN PASSWORD 'secure_password_here';
   END IF;
END
$do$;

SELECT 'CREATE DATABASE bistro_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bistro_db')\gexec

ALTER DATABASE bistro_db OWNER TO bistro_user;
GRANT ALL PRIVILEGES ON DATABASE bistro_db TO bistro_user;
