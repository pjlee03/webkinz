import sqlite3
from flask import Blueprint, render_template, request, session, redirect, url_for
from db import get_db
import bcrypt

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email    = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm = request.form.get("confirm", "")
        if not username or not email or not password:
            return render_template("register.html", error="All fields are required.")
        if password != confirm:
            return render_template("login.html", error="Passwords do not match.", active_tab="signup")
        if len(password) < 8:
            return render_template("register.html", error="Password must be at least 8 characters.")

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

        db = get_db()
        try:
            db.execute(
                "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                (username, email, hashed)
            )
            db.commit()
            user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            db.execute("INSERT OR IGNORE INTO customization (user_id) VALUES (?)", (user["id"],))
            db.commit()
        except sqlite3.IntegrityError:
            db.close()
            return render_template("login.html", error="Username or email already taken.", active_tab="signup")
        except Exception as e:
            db.close()
            app.logger.error(f"Registration error: {e}")
            return render_template("login.html", error="An unexpected error occurred. Please try again.", active_tab="signup")
        db.close()

        session["user_id"] = user["id"]
        session["username"] = user["username"]
        return redirect(url_for("index"))

    return render_template("register.html")

@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email    = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        db = get_db()
        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        db.close()

        if not user or not bcrypt.checkpw(password.encode(), user["password"]):
            return render_template("login.html", error="Invalid email or password.")

        session["user_id"] = user["id"]
        session["username"] = user["username"]
        return redirect(url_for("index"))

    return render_template("login.html")

@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))
