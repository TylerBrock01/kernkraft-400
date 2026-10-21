import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  async findOne(id: number, products?: string) {
    const options : FindManyOptions<Deck> ={
      where:{id}
    }
    if (products === "true") {
      options.relations = {
        products: true
      }
      options.order ={
        products:{
          id: 'ASC'
        }
      }
    }
    const deck = await this.deckRepository.findOne(options);
    if (!deck) {
      throw new NotFoundException(`Deck ${id} not found`);
    }
    return deck;
  }

  async update(id: number, updateDeckDto: UpdateDeckDto) {
    const deck = await this.findOne(id);
    if (!deck) {
      throw new NotFoundException(`Deck ${id} not found`);
    }
    deck.name = updateDeckDto.name;
    return this.deckRepository.save(deck);
  }

  async remove(id: number) {
    const deck = await this.findOne(id);
    if (!deck) {
      throw new NotFoundException(`Deck ${id} not found`);
    }
    await this.deckRepository.remove(deck);
    return `This action removes a #${id} deck`;
  }
}
