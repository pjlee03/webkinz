from flask import Flask, jsonify, session, render_template, send_from_directory, redirect, url_for
from functools import wraps
from dotenv import load_dotenv
from db import init_db, get_db
from auth import auth_bp
import os

load_dotenv()

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.getenv("SECRET_KEY")

app.register_blueprint(auth_bp)

with app.app_context():
    init_db()

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return redirect(url_for("auth.login"))
        return f(*args, **kwargs)
    return decorated

@app.route("/")
def index():
    return render_template("index.html", user=session.get("username"))
@app.route("/home/")
def home_game():
    return send_from_directory("static/home", "home.html")

@app.route("/home/zoo_map.html")
def zoo_map():
    return send_from_directory("static/home", "zoo_map.html")
@app.route("/GeoGuessr/")
def geoguessr():
    return send_from_directory("static/GeoGuessr","index.html")

@app.route("/Species guessing game/")
def species_game():
    return send_from_directory("static/Species guessing game", "index.html")

@app.route("/Species guessing game/mode-select.html")
def species_mode_select():
    return send_from_directory("static/Species guessing game", "mode-select.html")

@app.route("/home/")
def home():
    return send_from_directory("static/home","zoo_map.html")

@app.route("/api/scores/geoguessr")
def geoguessr_scores():
    db = get_db()
    def get_top(game):
        rows = db.execute("""
            SELECT s.score, s.achieved_at, u.username
            FROM scores s JOIN users u ON s.user_id = u.id
            WHERE s.game = ?
            ORDER BY s.score DESC LIMIT 10
        """, (game,)).fetchall()
        return [{"score": r["score"],
                 "date": r["achieved_at"][:10],
                 "user": r["username"]} for r in rows]

    result = {
        "challenge": get_top("geoguessr_challenge"),
        "timed":     get_top("geoguessr_timed")
    }
    db.close()
    return jsonify(result)
if __name__ == "__main__":
    app.run()

