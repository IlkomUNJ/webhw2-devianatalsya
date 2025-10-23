import type { HttpContext } from '@adonisjs/core/http'

export default class FakeAuthController {

  async showLogin({ view }: HttpContext) {
    return view.render('auth/login')
  }

  async loginAsUser({ session, response }: HttpContext) {
    session.put('role', 'buyer')
    return response.redirect('/home') 
  }

  async loginAsSeller({ session, response }: HttpContext) {
    session.put('role', 'seller')
    return response.redirect('/seller/products') 
  }

  async logout({ session, response }: HttpContext) {
    session.forget('role')
    return response.redirect('/login')
  }
}
