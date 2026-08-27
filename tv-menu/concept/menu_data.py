"""
Approved Spanish TV-menu taxonomy for La Sabrosita.

Single source for the item lists so the width-measuring pass and the render pass
can never disagree.

CORRECTION applied 2026-08-15: "Crazy Shake Oreo", "Crazy Shake Marshmallows" and
"Crazy Shake Cookies" were three separate HELADOS lines. They are flavours of one
product, not three menu items. They collapse to a single line, "Crazy Shake".
That takes the board from 51 lines to 49.
"""

MENU = {
    "HELADOS": ("HELADOS", "& PALETAS", [
        "Banana Split", "Choco Banana", "Crazy Shake", "Helado en Cono",
        "Helado Viral", "La Sabrosita", "Paletas", "Paletas Locas",
        "Sandwich de Helado"]),
    "ANTOJITOS": ("ANTOJITOS", "& PREPARADOS", [
        "Diablitos", "Elote", "Elote Hot Cheetos", "Esquimal", "Esquite",
        "Esquite Hot Cheetos", "Chicharron en Rueda", "Chicharron Preparado",
        "Marucha Loca", "Nachos", "Platano Frito", "Tostilocos", "Tosti Esquite"]),
    "POSTRES": ("POSTRES", "& DULCES", [
        "Bionico", "Bionico con Nieve", "Bomba", "Canasta", "Churros",
        "Coctel de Fruta", "Crepa", "Crepa Dubai", "Croissant", "Fresas con Crema",
        "Fresas Dubai", "Fresas en Cajita", "Gelatina", "Mango en Flor",
        "Mini Pancakes", "Mini Pancakes Dubai", "Pastel Tres Leche", "Waffle"]),
    "BEBIDAS": ("BEBIDAS", "", [
        "Aguas Frescas", "Aguas Explosivas", "Chamoyada", "Frappe", "Licuado",
        "Mangonada", "Michelaguas", "Raspado", "Sodas Exoticas"]),
}

# Every food image placed on the board, keyed to its approved MASTER filename in
# tv-menu/assets/products/. Nothing may be rendered that is not in this list.
FOOD_MASTERS = [
    ("LS_Crazy-Shakes_MASTER_v01.png",   "Crazy Shake"),
    ("LS_Crazy-Shakes_MASTER_v03.png",   "Crazy Shake"),
    ("LS_Chamoyada_MASTER_v01.png",      "Chamoyada"),
    ("LS_Esquimales_MASTER_v01.png",     "Esquimal"),
    ("LS_Mango-en-Palo_MASTER_v02.png",  "Mango en Flor"),
    ("LS_Esquites_MASTER_v01.png",       "Esquite"),
    ("LS_Frappe_20oz_MASTER_v01.png",    "Frappe"),
    ("LS_Raspados_MASTER_v01.png",       "Raspado"),
    ("LS_Waffle_MASTER_v01.png",         "Waffle"),
    ("LS_Fresas-con-Crema_MASTER_v01.png", "Fresas con Crema"),
]

# Required client messaging, verbatim. (colour-key, icon, prefix, highlight, suffix)
BOTTOM = [
    ("pink",   "drop",  "Diferentes sabores de ", "Aguas Frescas", " todos los días."),
    ("blue",   "cone",  "Diferentes sabores de ", "helado", " todos los días."),
    ("yellow", "leaf",  "Todos nuestros sabores son ", "naturales.", " Sin sabores artificiales."),
    ("pink",   "heart", "Personaliza tu helado con tus ", "sabores y toppings", " favoritos."),
]

TITLES = ["HELADOS &amp; PALETAS", "ANTOJITOS &amp; PREPARADOS",
          "POSTRES &amp; DULCES", "BEBIDAS"]
