module.exports = class Product {
    title: string
    price: number
    thumbnail: string
    id: number
    constructor(title: string, price: number, thumbnail: string, id: number) {
        this.title = title;
        this.price = price;
        this.thumbnail = thumbnail;
        this.id = id;
    }

    showProduct() {
        return {
            title: this.title,
            price: this.price,
            thumbnail: this.thumbnail,
            id: this.id
        }
    }
}
