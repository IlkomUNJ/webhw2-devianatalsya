import router from '@adonisjs/core/services/router'
import { GlobalWishlist, GlobalProducts } from '#start/global_data'
import FakeAuthController from '#controllers/fake_auths_controller'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import fs from 'fs'
import path from 'path'


router.post('/seller/delete-product/:id', async ({ params, response }) => {
  const id = params.id

  const index = GlobalProducts.findIndex((p) => p.id === id)
  if (index === -1) {
    return response.redirect('/seller/products')
  }

  const imagePath = GlobalProducts[index].images[0]
  if (imagePath.startsWith('/uploads/')) {
    const fullPath = path.join(app.makePath('public'), imagePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  }

  GlobalProducts.splice(index, 1)


  const wishIndex = GlobalWishlist.findIndex((item) => item.id === id)
  if (wishIndex !== -1) GlobalWishlist.splice(wishIndex, 1)

  return response.redirect('/seller/products')
})

function seedDefaultProducts() {
  if (GlobalProducts.length === 0) {
    const defaultProducts = [
      { id: '1', name: 'Rose Elegance Bouquet', price: '$20.00', images: ['images/bunga1.png'], seller: 'Blooms' },
      { id: '2', name: 'Spring Tulip Harmony', price: '$17.10', images: ['images/bunga2.png'], seller: 'Blooms' },
      { id: '3', name: 'Sunset Blossom Mix', price: '$18.70', images: ['images/bunga3.png'], seller: 'Blooms' },
      { id: '4', name: 'Classic Red Rose Vase', price: '$25.20', images: ['images/bunga4.png'], seller: 'Blooms' },
      { id: '5', name: 'Lily & Rose Charm', price: '$19.70', images: ['images/bunga5.jpeg'], seller: 'Blooms' },
      { id: '6', name: 'Peach Rose Delight', price: '$22.90', images: ['images/bunga6.png'], seller: 'Blooms' },
      { id: '7', name: 'Pink Blossom Fantasy', price: '$18.24', images: ['images/bunga7.png'], seller: 'Blooms' },
      { id: '8', name: 'Vintage Garden Mix', price: '$18.60', images: ['images/bunga8.png'], seller: 'Blooms' },
      { id: '9', name: 'Cherry Bloom Vase', price: '$17.00', images: ['images/bunga9.png'], seller: 'Blooms' },
    ]
    GlobalProducts.push(...defaultProducts)
  }
}

router.get('/seller/products', async ({ view }) => {
  seedDefaultProducts()
  return view.render('seller/dashboard', {
    products: GlobalProducts,
    wishlistData: GlobalWishlist,
  })
})

router.post('/seller/add-product', async ({ request, response }) => {
  const name = request.input('name')
  const price = request.input('price')
  const seller = request.input('seller') || 'Unknown Seller'

  const imageFile = request.file('image', {
    size: '2mb',
    extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  })

  let imagePath = 'images/default.png'

  if (imageFile) {
    if (!imageFile.isValid) {
      return response.redirect('/seller/products')
    }

    const fileName = `${cuid()}.${imageFile.extname}`
    await imageFile.move(app.makePath('public/uploads'), { name: fileName })
    imagePath = `uploads/${fileName}`
  }

  GlobalProducts.push({
    id: String(GlobalProducts.length + 1),
    name,
    price: `$${price}`,
    images: [imagePath],
    seller,
  })
  return response.redirect('/seller/products')
})

router.get('/login', [FakeAuthController, 'showLogin']).as('login')
router.post('/login/buyer', [FakeAuthController, 'loginAsUser'])
router.post('/login/seller', [FakeAuthController, 'loginAsSeller'])
router.post('/logout', async ({ session, response }) => {
  session.forget('role') 
  return response.redirect('/login')
})

router.get('/login/admin', async ({ view }) => {
  return view.render('auth/loginadmin')
})

router.post('/login/admin', async ({ request, response, session }) => {
  const username = request.input('username')
  const password = request.input('password')

  const ADMIN_USERNAME = 'admin'
  const ADMIN_PASSWORD = '123'

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    session.put('role', 'seller')
    return response.redirect('/seller/products')
  } else {
    return response.redirect('/login/admin')
  }
})

router.get('/', async ({ response }) => response.redirect('/login'))
router.on('/home').render('pages/home')
router.on('/about').render('pages/about')
router.on('/contact').render('pages/contact')

router.get('/product', async ({ view }) => {
  seedDefaultProducts()
  return view.render('pages/product', { products: GlobalProducts })
})

router.get('/wishlist', async ({ view, session }) => {
  const wishlist = session.get('wishlist') || []
  return view.render('user/wishlist', { wishlist })
})

router.post('/wishlist/add/:id', async ({ params, session, response }) => {
  const id = params.id
  const product = GlobalProducts.find((p) => p.id === id)
  const wishlist = session.get('wishlist') || []

  if (product && !wishlist.find((item) => item.id === id)) {
    wishlist.push(product)
    session.put('wishlist', wishlist)
    GlobalWishlist.push({ ...product, buyer: 'Anonymous Buyer' })
  }

  return response.redirect('/wishlist')
})

router.post('/wishlist/remove/:id', async ({ params, session, response }) => {
  const id = params.id
  const wishlist = session.get('wishlist') || []
  session.put('wishlist', wishlist.filter((item) => item.id !== id))
  const index = GlobalWishlist.findIndex((item) => item.id === id)
  if (index !== -1) GlobalWishlist.splice(index, 1)
  return response.redirect('/wishlist')
})

router.post('/wishlist/clear', async ({ session, response }) => {
  const wishlist = session.get('wishlist') || []
  wishlist.forEach((item) => {
    const index = GlobalWishlist.findIndex((globalItem) => globalItem.id === item.id)
    if (index !== -1) GlobalWishlist.splice(index, 1)
  })
  session.forget('wishlist')
  return response.redirect('/wishlist')
})
