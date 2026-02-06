import { ConflictException, Injectable } from '@nestjs/common';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Deck } from './entities/deck.entity';

@Injectable()
export class DecksService {
  constructor(
    @InjectRepository(Deck)
    private readonly deckRepository: Repository<Deck>,
  ) {
  }
  async create(createDeckDto: CreateDeckDto) {
    const deck = new Deck()
    deck.name = createDeckDto.name;
    const existingDeck = await this.deckRepository.findOneBy({
      name: deck.name
    });
    if (existingDeck) {
      throw new ConflictException(`Deck ${deck.name} is already exist.`);
    }
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
