import requests
from geopy.geocoders import Nominatim

def draw_god_eyes():
    god_eyes = [
        "  GGG   OOO  DDDD       EEEE  YY  YY EEEE  SSS ",
        " G   G O   O D   D      E     YY  YY E    S    ",
        " G     O   O D    D     EEE    YYYY  EEE   SSS ",
        " G  GG O   O D   D      E       YY   E        S",
        "  GGG   OOO  DDDD       EEEE    YY   EEEE SSS  "
    ]
    for line in god_eyes:
        print(line)

def get_satellite_image(street, city, state, zip_code, access_token, width=300, height=200, zoom=9.6):
    address = f"{street}, {city}, {state} {zip_code}"
    geolocator = Nominatim(user_agent="god_eyes")
    location = geolocator.geocode(address)
    if location:
        lat_lon = f"{location.longitude},{location.latitude}"
        base_url = "https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/"
        url = f"{base_url}{lat_lon},{zoom},0/{width}x{height}?access_token={access_token}"
        response = requests.get(url)
        if response.status_code == 200:
            return response.url
        else:
            return "Error: Could not retrieve image. Status code: " + str(response.status_code)
    else:
        return "Error: Address not found."

if __name__ == "__main__":
    draw_god_eyes()
    ACCESS_TOKEN = "pk.eyJ1IjoidHJhcHp6eTAxIiwiYSI6ImNsdGRzN3BvMjA5YXMyanFsczQ1c2V6c2wifQ.MV2iu5HUwsUSQ1KFOAnRww"
    street = input("Enter the street address: ")
    city = input("Enter the city: ")
    state = input("Enter the state: ")
    zip_code = input("Enter the zip code: ")
    image_url = get_satellite_image(street, city, state, zip_code, ACCESS_TOKEN)
    print(f"\nSatellite image URL: {image_url}")
