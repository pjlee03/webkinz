import pytest
import os
import tempfile
from app import app
from db import init_db, get_db




@pytest.fixture
def client():
    db_fd, db_path = tempfile.mkstemp()
    app.config["TESTING"] = True
    app.config["SECRET_KEY"] = "test-secret-key"

    import db as db_module
    original_path = db_module.DB_PATH
    db_module.DB_PATH = db_path

    with app.test_client() as client:
        with app.app_context():
            init_db()
        yield client

    db_module.DB_PATH = original_path
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def registered_client(client):
    client.post("/auth/register", data={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "confirm": "password123"
    }, follow_redirects=True)
    return client


@pytest.fixture
def logged_in_client(registered_client):
    registered_client.post("/auth/login", data={
        "email": "test@example.com",
        "password": "password123"
    }, follow_redirects=True)
    return registered_client


# HOME / INDEX


class TestIndex:
    def test_index_loads(self, client):
        res = client.get("/")
        assert res.status_code == 200

    def test_index_shows_login_when_logged_out(self, client):
        res = client.get("/")
        assert b"Login" in res.data

    def test_index_shows_username_when_logged_in(self, logged_in_client):
        res = logged_in_client.get("/")
        assert b"testuser" in res.data


# AUTH - REGISTER


class TestRegister:
    def test_register_success_redirects(self, client):
        """Successful register should redirect to index."""
        res = client.post("/auth/register", data={
            "username": "newuser",
            "email": "new@example.com",
            "password": "password123",
            "confirm": "password123"
        }, follow_redirects=True)
        assert res.status_code == 200

    def test_register_duplicate_email(self, registered_client):
        res = registered_client.post("/auth/register", data={
            "username": "otheruser",
            "email": "test@example.com",
            "password": "password123",
            "confirm": "password123"
        })
        assert b"already taken" in res.data

    def test_register_duplicate_username(self, registered_client):
        res = registered_client.post("/auth/register", data={
            "username": "testuser",
            "email": "other@example.com",
            "password": "password123",
            "confirm": "password123"
        })
        assert b"already taken" in res.data

    def test_register_password_mismatch(self, client):
        res = client.post("/auth/register", data={
            "username": "newuser",
            "email": "new@example.com",
            "password": "password123",
            "confirm": "wrongpassword"
        })
        assert b"do not match" in res.data

    def test_register_short_password(self, client):
        res = client.post("/auth/register", data={
            "username": "newuser",
            "email": "new@example.com",
            "password": "short",
            "confirm": "short"
        })
        assert b"8 characters" in res.data

    def test_register_missing_fields(self, client):
        res = client.post("/auth/register", data={
            "username": "",
            "email": "",
            "password": "",
            "confirm": ""
        })
        assert b"required" in res.data



# AUTH - LOGIN


class TestLogin:
    def test_login_page_loads(self, client):
        res = client.get("/auth/login")
        assert res.status_code == 200

    def test_login_success(self, registered_client):
        res = registered_client.post("/auth/login", data={
            "email": "test@example.com",
            "password": "password123"
        }, follow_redirects=True)
        assert res.status_code == 200

    def test_login_wrong_password(self, registered_client):
        res = registered_client.post("/auth/login", data={
            "email": "test@example.com",
            "password": "wrongpassword"
        })
        assert b"Invalid email or password" in res.data

    def test_login_wrong_email(self, registered_client):
        res = registered_client.post("/auth/login", data={
            "email": "wrong@example.com",
            "password": "password123"
        })
        assert b"Invalid email or password" in res.data



# AUTH - LOGOUT

class TestLogout:
    def test_logout_redirects(self, logged_in_client):
        res = logged_in_client.get("/auth/logout", follow_redirects=True)
        assert res.status_code == 200

    def test_logout_clears_session(self, logged_in_client):
        logged_in_client.get("/auth/logout")
        res = logged_in_client.get("/")
        assert b"testuser" not in res.data



# GAME ROUTES


class TestGameRoutes:
    def test_geoguessr_loads(self, client):
        res = client.get("/GeoGuessr/")
        assert res.status_code == 200

    def test_species_game_loads(self, client):
        res = client.get("/Species guessing game/")
        assert res.status_code == 200

    def test_home_game_loads(self, client):
        res = client.get("/home/")
        assert res.status_code == 200



# SCORES API



class TestScoresApi:
    def test_geoguessr_scores_public(self, client):
        res = client.get("/api/scores/geoguessr")
        assert res.status_code == 200
        data = res.get_json()
        assert "challenge" in data
        assert "timed" in data

    def test_submit_score_requires_login(self, client):
        res = client.post("/api/score",
            json={"game": "geoguessr_challenge", "score": 1000})
        # Should redirect to login, not 404
        assert res.status_code in (302, 401)

    def test_submit_score_success(self, logged_in_client):
        res = logged_in_client.post("/api/score",
            json={"game": "geoguessr_challenge", "score": 1000})
        assert res.status_code == 200
        assert res.get_json()["status"] == "ok"

    def test_submit_score_missing_game_field(self, logged_in_client):
        res = logged_in_client.post("/api/score",
            json={"score": 1000})
        assert res.status_code == 400

    def test_submit_score_missing_score_field(self, logged_in_client):
        res = logged_in_client.post("/api/score",
            json={"game": "geoguessr_challenge"})
        assert res.status_code == 400

    def test_scores_appear_after_submit(self, logged_in_client):
        logged_in_client.post("/api/score",
            json={"game": "geoguessr_challenge", "score": 4200})
        res = logged_in_client.get("/api/scores/geoguessr")
        data = res.get_json()
        assert any(s["score"] == 4200 for s in data["challenge"])
