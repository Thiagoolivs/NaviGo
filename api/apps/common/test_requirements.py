"""Garante que o requirements.txt (usado na imagem Docker) não fique defasado.

A imagem de produção instala a partir do requirements.txt, enquanto o
desenvolvimento usa o pyproject/uv.lock. Se alguém adiciona uma dependência e
esquece de reexportar, o app sobe em produção e quebra com ModuleNotFoundError
— foi o que aconteceu com o `qrcode`.
"""

import re
import tomllib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent


def pacotes_do_requirements() -> set[str]:
    conteudo = (BASE_DIR / "requirements.txt").read_text()
    return {
        linha.split("==")[0].strip().lower().replace("_", "-")
        for linha in conteudo.splitlines()
        if linha and not linha.startswith((" ", "#", "-"))
    }


def dependencias_do_pyproject() -> set[str]:
    dados = tomllib.loads((BASE_DIR / "pyproject.toml").read_text())
    nomes = set()
    for dep in dados["project"]["dependencies"]:
        # "qrcode[pil]>=8.0" -> "qrcode"
        nome = re.split(r"[\[><=!;]", dep, maxsplit=1)[0].strip()
        nomes.add(nome.lower().replace("_", "-"))
    return nomes


def test_requirements_cobre_todas_as_dependencias():
    faltando = dependencias_do_pyproject() - pacotes_do_requirements()
    assert not faltando, (
        f"Dependências ausentes no requirements.txt: {sorted(faltando)}. "
        "Rode: uv export --no-dev --format requirements-txt "
        "--no-emit-project -o requirements.txt"
    )
