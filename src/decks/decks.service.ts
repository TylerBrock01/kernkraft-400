import { Injectable } from '@nestjs/common';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deck } from './entities/deck.entity';

@Injectable()
export class DecksService {
  constructor(
    @InjectRepository(Deck)
    private readonly deckRepository: Repository<Deck>,
  ) {
  }
  create(createDeckDto: CreateDeckDto) {
    const deck = new Deck()
    deck.name = createDeckDto.name;
    return this.deckRepository.save(deck);
  }

  findAll() {
    return this.deckRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} deck`;
  }

  update(id: number, updateDeckDto: UpdateDeckDto) {
    return `This action updates a #${id} deck`;
  }

  remove(id: number) {
    return `This action removes a #${id} deck`;
  }
}
