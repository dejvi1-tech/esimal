import pytest
import os
import uuid
import psycopg2

DB_URL = os.getenv('TEST_DB_URL') or 'postgresql://postgres:postgres@localhost:5432/postgres'

@pytest.fixture(scope='module')
def db():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    yield conn
    conn.close()

def random_uuid():
    return str(uuid.uuid4())

def test_not_null_constraints(db):
    cur = db.cursor()
    # user_id, package_id, status are NOT NULL
    with pytest.raises(psycopg2.errors.NotNullViolation):
        cur.execute("INSERT INTO user_orders (user_id, package_id, status) VALUES (NULL, %s, 'pending')", (random_uuid(),))
    with pytest.raises(psycopg2.errors.NotNullViolation):
        cur.execute("INSERT INTO user_orders (user_id, package_id, status) VALUES (%s, NULL, 'pending')", (random_uuid(),))
    with pytest.raises(psycopg2.errors.NotNullViolation):
        cur.execute("INSERT INTO user_orders (user_id, package_id, status) VALUES (%s, %s, NULL)", (random_uuid(), random_uuid()))

def test_status_enum_check(db):
    cur = db.cursor()
    # Insert with invalid status
    user_id = random_uuid()
    package_id = random_uuid()
    with pytest.raises(psycopg2.errors.CheckViolation):
        cur.execute("INSERT INTO user_orders (user_id, package_id, status) VALUES (%s, %s, 'invalid_status')", (user_id, package_id))

def test_fk_constraint(db):
    cur = db.cursor()
    # Insert with non-existent user/package
    with pytest.raises(psycopg2.errors.ForeignKeyViolation):
        cur.execute("INSERT INTO user_orders (user_id, package_id, status) VALUES (%s, %s, 'pending')", (random_uuid(), random_uuid()))

def test_on_delete_cascade(db):
    cur = db.cursor()
    # Create user, package, and user_order
    cur.execute("INSERT INTO users (id, email) VALUES (%s, %s)", (random_uuid(), 'test@example.com'))
    cur.execute("INSERT INTO my_packages (id, name, country_name, data_amount) VALUES (%s, %s, %s, %s)", (random_uuid(), 'Test', 'AL', 1))
    cur.execute("SELECT id FROM users WHERE email='test@example.com'")
    user_id = cur.fetchone()[0]
    cur.execute("SELECT id FROM my_packages WHERE name='Test'")
    package_id = cur.fetchone()[0]
    cur.execute("INSERT INTO user_orders (user_id, package_id, status) VALUES (%s, %s, 'pending')", (user_id, package_id))
    # Delete user, user_order should be deleted
    cur.execute("DELETE FROM users WHERE id=%s", (user_id,))
    cur.execute("SELECT COUNT(*) FROM user_orders WHERE user_id=%s", (user_id,))
    assert cur.fetchone()[0] == 0
    # Clean up package
    cur.execute("DELETE FROM my_packages WHERE id=%s", (package_id,)) 