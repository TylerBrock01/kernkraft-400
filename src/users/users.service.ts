import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Este es el método que te faltaba
  create(userData: Partial<User>) {
    const newUser = this.userRepository.create(userData);
    return this.userRepository.save(newUser);
  }

  // Para el login exclusivamente: Traemos el password
  async findOneWithPassword(email: string) {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role', 'name'] // Aquí "forzamos" el password
    });
  }

  // Para todo lo demás: El password no viene
  async findOneByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
