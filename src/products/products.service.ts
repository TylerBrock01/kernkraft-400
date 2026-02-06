import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Deck } from '../decks/entities/deck.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Deck) private readonly deckRepository: Repository<Deck>,
  ) {
  }
  async create(createProductDto: CreateProductDto) {
    const category = await this.categoryRepository.findOneBy({id: createProductDto.categoryId});
    const deck = await this.deckRepository.findOneBy({id: createProductDto.categoryId});
    if(!category || !deck) {
      let erros: string[]= []
      erros.push('Categoria no encontrada')
      throw new NotFoundException(erros);
    }

    return this.productRepository.save({...createProductDto, category,deck});
  }

  async findAll( category_id?: number, deck_id?:number, take?: number, skip?: number) {
    const options:  FindManyOptions<Product> ={loadEagerRelations: true, order:{"id":"DESC"},take,skip}
    if(category_id){
      options.where = {
        category: { id: category_id }
      }
    }
    if (deck_id){
      options.where = {
        deck: { id: deck_id }
      }
    }
    const [products] =await this.productRepository.findAndCount(options);
    return {products};
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({where: {id}, relations: {category: true}});
    if (!product) throw new NotFoundException(
      `Product #${id} not found`
    )
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    console.log(id)
    const product = await this.findOne(id);
    if (!product) throw new NotFoundException(
      `Product #${id} not found`
    )
    Object.assign(product, updateProductDto);

    if(updateProductDto.categoryId){
      const category = await this.categoryRepository.findOneBy({id: updateProductDto.categoryId});
      if(!category){
        let erros: string[]= []
        erros.push('Categoria no encontrada')
        throw new NotFoundException(erros);
      }
    }
    return await this.productRepository.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    if (!product) throw new NotFoundException('Product not found')
    await this.productRepository.remove(product);
    return {message : `Product #${id} REMOVED`};
  }
}
