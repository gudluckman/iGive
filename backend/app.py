from flask import Flask
from flask_cors import CORS
import logging
from blueprints.course import course
from blueprints.task import task
from blueprints.user import user
from blueprints.testing import testing

logging.basicConfig(level=logging.WARNING)
logging.getLogger("werkzeug").setLevel(logging.WARNING)
app = Flask(__name__)

app.register_blueprint(course, url_prefix="/api/course")
app.register_blueprint(task, url_prefix="/api/task")
app.register_blueprint(user, url_prefix="/api/user")
app.register_blueprint(testing, url_prefix="/api/testing")


CORS(app)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9900, debug=True)
