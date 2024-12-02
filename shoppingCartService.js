const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const app = express()

// set port
const PORT = 6666

const CARTS_FILE = path.join(__dirname, 'shoppingCarts.js')

app.use(cors())
app.use(express.json())

const readCarts = () => {
    delete require.cache[require.resolve('./shoppingCarts')] // clear cache to get fresh data
    return require('./shoppingCarts')
}

const writeCarts = (data) => {
    const fileContent = `module.exports = ${JSON.stringify(data, null, 4)};`
    fs.writeFileSync(CARTS_FILE, fileContent, 'utf8')
}

// GET all
app.get('/', (req, res) => {
    try {
        const carts = readCarts()
        res.status(200).json(carts)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// GET request
app.get('/:id', (req, res) => {
    const { id } = req.params

    try {
        const carts = readCarts()
        const result = carts.find(({ cartId }) => cartId === id) ?? []
        res.status(200).json(result)
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// POST
app.post('/', (req, res) => {
    const { body } = req
    const { cartId } = body

    try {
        const carts = readCarts()
        const match = carts.find((item) => item.cartId === cartId)

        if (match) {
            res.status(409).json({ message: 'Write Error: cartId already exists' })
        } else {
            // add new recommendation to the file
            carts.push(body)
            writeCarts(carts)
            res.status(201).json({ message: 'Recommendation added successfully', data: body })
        }
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// PATCH
app.patch('/', (req, res) => {
    const { body } = req
    const { cartId, products } = body

    try {
        const carts = readCarts()
        const match = carts.find((item) => item.cartId === cartId)

        if (!match) {
            res.status(404).json({ message: 'cartId not found' })
        }

        products.forEach((product) => {
            const existingProduct = match.products.find((item) => item.productId === product.productId)

            if (existingProduct) {
                // update quantity of existing product
                existingProduct.quantity = product.quantity

                // remove the product if quantity is zero
                if (existingProduct.quantity === 0) {
                    match.products = match.products.filter((item) => item.productId !== product.productId)
                }
            } else if (product.quantity > 0) {
                // add new product if quantity is greater than zero
                match.products.push(product)
            }
        })

        writeCarts(carts)
        res.status(200).json({
            message: 'Updated successfully',
            updatedRecommendation: match,
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
})

// start the server
app.listen(PORT, () => {
    console.log(`CORS-enabled web server listening on port ${PORT}...`)
})
