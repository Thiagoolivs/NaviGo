"""Configuração do gunicorn.

Por padrão o gunicorn escreve os logs de inicialização no stderr, e o Railway
classifica tudo que vem do stderr como "error" — o que faz um deploy saudável
parecer quebrado. Aqui mandamos os logs de erro/inicialização para o stdout,
junto com os de acesso.
"""

import os

bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
workers = int(os.environ.get("WEB_CONCURRENCY", "3"))
timeout = 60
accesslog = "-"  # stdout

logconfig_dict = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "generic": {
            "format": "[%(asctime)s] [%(process)d] [%(levelname)s] %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S %z",
        }
    },
    "handlers": {
        "stdout": {
            "class": "logging.StreamHandler",
            "formatter": "generic",
            "stream": "ext://sys.stdout",
        }
    },
    "loggers": {
        "gunicorn.error": {"level": "INFO", "handlers": ["stdout"], "propagate": False},
        "gunicorn.access": {"level": "INFO", "handlers": ["stdout"], "propagate": False},
    },
    "root": {"level": "INFO", "handlers": ["stdout"]},
}
