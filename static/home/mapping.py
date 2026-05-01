import folium
from folium import Element
import pandas as pd
import time
import geocoder


zoo_dict=[
    {"name": "Pittsurgh Zoo", "lat": 40.4843, "lon": 79.9222, "cam": "https://www.pittsburghzoo.org/animals/webcams-online-activities/penguin-webcam/"},
    {"name": "Smithsonian National Zoo ", "lat": 38.9296, "lon" :  -77.0498, "cam": "https://nationalzoo.si.edu/webcams/panda-cam"},
    {"name": "Houston Zoo", "lat":29.7158 , "lon" : -95.3909, "cam": "https://www.houstonzoo.org/explore/webcams/elephant-yard-cam/"},
    {"name": "San Diego Zoo ", "lat": 32.7353, "lon" : -117.1490, "cam": "https://zoo.sandiegozoo.org/cams/baboon-cam"},
    {"name": "Edinburgh Zoo", "lat": 55.9459, "lon" : 3.2690, "cam": "https://www.edinburghzoo.org.uk/webcams/rockhopper-cam"},
    {"name": "Awaji Island Monkey Center", "lat": 34.2569, "lon" :134.8276 , "cam": "http://skylinewebcams.com/en/webcam/japan/hyogo/sumoto/awaji-monkey-center.html"},
    {"name": "Wolong Grove", "lat":31.02 , "lon" :103.10, "cam": "https://explore.org/livecams/panda-bears/china-panda-cam-1"},
    {"name": "Vancouver Aquarium", "lat":49.3005 , "lon" :-123.1309, "cam": "https://www.youtube.com/watch?v=9mg9PoFEX2U"},
    {"name": "Hoedspruit Endangered Species Centre", "lat": -24.5138, "lon" :31.0323, "cam": "https://www.youtube.com/watch?v=oruIH1ZadqE"},
    {"name": "Zarafa Camp", "lat":-18.58583, "lon" :23.53388, "cam": "https://www.youtube.com/watch?v=2EZavJUNdLI"},
    {"name": "Gesellschaft zur Erhaltung", "lat": 51.3380, "lon" :9.8590, "cam": "https://www.youtube.com/watch?v=_EmLriL9494"},
    {"name": "Canopy Lodge", "lat": 8.62, "lon" :-80.14, "cam": "https://www.youtube.com/watch?v=WtoxxHADnGk"}

    #{"name": "", "lat": , "lon" :, "cam": ""},
]



df=pd.DataFrame(zoo_dict)


m=folium.Map(
    location=[df['lat'].mean(),df['lon'].mean()],
     tiles="OpenStreetMap",
     zoom_start=2
)

for _, row in df.iterrows():
    popup_html = f"""
    <b>{row['name']}</b><br>
    <a href="{row['cam']}" target="_blank">Watch Live Cam</a>
    """

    folium.Marker(
        location=[row['lat'], row['lon']],
        popup=folium.Popup(popup_html, max_width=300)
    ).add_to(m)

home_button_html = """
<div style="position: fixed; top: 20px; right: 20px; z-index: 9999; pointer-events: auto;">
    <a href="../index.html" style="background-color: #2E27F5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-family: Arial, sans-serif; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2);">
        Home
    </a>
</div>
"""

m.get_root().html.add_child(Element(home_button_html))

m.save("zoo_map.html")
