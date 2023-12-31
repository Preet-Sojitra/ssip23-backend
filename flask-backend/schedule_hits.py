import schedule
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from sqlalchemy import create_engine, text
from sqlalchemy import MetaData
import pymongo

db_username = 'root'
db_password = 'root'
db_name = 'artisans'
db_host = 'localhost'
db_port = '5432'

db_string = f'postgresql://{db_username}:{db_password}@{db_host}:{db_port}/{db_name}'
db = create_engine(db_string)

client = pymongo.MongoClient('mongodb://localhost:27017/')
db_mongo = client['SSIP']
products = db_mongo['products']

options = webdriver.FirefoxOptions()
options.add_argument("-headless")
driver = webdriver.Firefox(options=options)

def url_gen(search_term):
    url = 'https://www.amazon.in/s?k='
    for i in search_term.split(' '):
        url += i + '+'
    url = url[:-1]
    return url

def url_gen_amz(search_term):
    url = 'https://www.amazon.in/s?k='
    for i in search_term.split('_'):
        url += i + '+'
    url = url[:-1]
    return url

def url_gen_flp(search_term):
    url = 'https://www.flipkart.com/search?q=' + search_term
    return url

def get_prices(search_term):
    print(search_term)
    input_url = url_gen_amz(search_term)
    print(input_url)
    driver.get(input_url)
    price_string = driver.find_elements(By.CLASS_NAME, 'a-price') 
    
    l = []
    for i in price_string:
        l.append(i.text)
    input_url = url_gen_flp(search_term)
    driver.get(input_url)
    price_string = driver.find_elements(By.CLASS_NAME, '_30jeq3') 

    for i in price_string:
        l.append(i.text)

    l_prices = price_cleanup(l)
    l_prices = sorted(l_prices)
    median = l_prices[len(l_prices) // 2]
    return median


def price_cleanup(price_list):
    l = price_list
    l_prices = []
    for i in range(len(l)):
        l[i] = l[i][1:]
        s = ''
        for j in l[i]:
            if j!=',':
                s += j
        try:
            l[i] = int(s)
            l_prices.append(l[i])
        except Exception as e:
            pass
    return l_prices



def mongo_traverse():
     conn = db.connect()
     result = conn.execute(text("SELECT product_name FROM products"))
     prods = []
     for r in result: 
         prods.append(r[0])
     for x in products.find():
        if x['name'] in prods:
            conn.execute(text(f"UPDATE products SET median_price = {get_prices(x['name'])} WHERE product_name = {x['name']}"))
        else:
            conn.execute(text(f"INSERT INTO products (product_name, median_price) VALUES ({x['name']}, {get_prices(x['name'])})"))

# def db_traverse():
#     db_l =[]
#     with db.connect() as conn:
#         result = conn.execute(text("SELECT * FROM products"))
#         for row in result:
#             median_price = get_prices(row[0])
#             conn.execute(text(f"UPDATE products SET median_price = {median_price} WHERE product_name = {row[0]}"))

# schedule.every(5).minutes.do(db_traverse)
schedule.every(2).minutes.do(mongo_traverse)
while True:
    schedule.run_pending()
    time.sleep(250)


