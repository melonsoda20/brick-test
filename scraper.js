const puppeteer = require('puppeteer');
const ObjectsToCsv = require('objects-to-csv');

const pageURL  = 'https://www.tokopedia.com/p/handphone-tablet/handphone?page=1&rt=4,5&ob=5'; 
const itemContainerClass = 'css-bk6tzz e1nlzfl3';
const maxItemsLength = 100;

puppeteer.launch({headless: false}).then(async browser => {
    const tokpedTop100PhoneURL  = getPageURL(); 

    const page = await browser.newPage();

    await page.goto(tokpedTop100PhoneURL, {
        waitUntil: ['load', 'networkidle2'],
        timeout: 10000,
    });
    
    await page.exposeFunction('getContainerClass', getContainerClass);
    await page.exposeFunction('getItemLimit', getItemLimit);

    await autoScroll(page);
    
    const selectedItems = await page.evaluate(async() => {
        const itemContainerClass = await getContainerClass();
        const maxItemsLength = await getItemLimit();

        const itemsLink = [];

        const elements = document.getElementsByClassName(itemContainerClass);
        const elementsLength = elements.length;

        const itemLimit = maxItemsLength < elementsLength ? maxItemsLength : elementsLength;

        for(let i = 0; i < itemLimit; i++){
            itemsLink.push({
                productName: elements[i].getElementsByClassName('css-1bjwylw')[0].innerHTML,
                imageLink: elements[i].getElementsByTagName('img')[0].src,
                productLink: elements[i].getElementsByTagName('a')[0].href,
                price: elements[i].getElementsByClassName('css-o5uqvq')[0].innerHTML,
                rating: elements[i].getElementsByClassName('css-177n1u3').length,
                merchant: elements[i].getElementsByClassName('css-1kr22w3')[1].innerHTML 
            });
        }
        
        return itemsLink;
    });

    await new ObjectsToCsv(selectedItems).toDisk('./test.csv', { allColumns: true });

    await browser.close();
});

const autoScroll = async(page) => {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
};

const getPageURL = function(){
    return pageURL;
};

const getContainerClass = function(){
    return itemContainerClass;
}

const getItemLimit = function(){
    return maxItemsLength;
}