"""Month names for generated text."""
MONTHS = {
    "en": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    "fr": ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
}


def month_name(m: int, lang: str) -> str:
    return MONTHS[lang][m - 1]
