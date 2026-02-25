import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET, // Debe ser la misma que en el Module
    });
  }

  async validate(payload: any) {
    // Lo que retornes aquí se inyectará en el objeto Request (req.user)
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role };
  }
}
