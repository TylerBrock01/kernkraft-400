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
    private usersRepository: Repository<User>,
  ) {}

  // Este es el método que te faltaba
  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOneBy({ email });
  }

  async create(userData: any) {
    const newUser = this.usersRepository.create(userData);
    return this.usersRepository.save(newUser);
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
