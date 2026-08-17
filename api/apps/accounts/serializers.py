from dj_rest_auth.registration.serializers import RegisterSerializer


class NaviGoRegisterSerializer(RegisterSerializer):
    """Cadastro apenas com e-mail e senha.

    Remove o campo `username` do cadastro — o allauth gera um automaticamente
    a partir do e-mail (ACCOUNT_USER_MODEL_USERNAME_FIELD).
    """

    username = None

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data.pop("username", None)
        return data
