import fitz  # PyMuPDF

def extraire_texte_pdf(chemin_pdf: str, max_pages: int = 3, max_chars: int = 12000) -> str:
    """
    Extrait le texte d'un PDF avec une sécurité stricte pour protéger le budget API.
    - max_pages : On ne lit que les 3 premières pages (largement suffisant pour un CV).
    - max_chars : On coupe à 12 000 caractères (environ 2 500 mots) au cas où le texte est trop dense.
    """
    texte = ""
    try:
        with fitz.open(chemin_pdf) as doc:
            # Sécurité 1 : On boucle uniquement sur les premières pages
            for i, page in enumerate(doc):
                if i >= max_pages:
                    break
                texte += page.get_text()
        
        # Sécurité 2 : Troncature nette du texte si la limite est dépassée
        if len(texte) > max_chars:
            texte = texte[:max_chars] + "\n\n[INFO SYSTÈME : TEXTE TRONQUÉ POUR LIMITER LA TAILLE DU CV]"
            
        return texte

    except Exception as e:
        print(f"Erreur critique lors de la lecture du PDF {chemin_pdf} : {e}")
        return ""