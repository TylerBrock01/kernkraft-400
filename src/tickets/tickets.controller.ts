import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { BusinessActiveGuard } from '../auth/guards/business-active.guard';

@Controller('tickets')
@UseGuards(BusinessActiveGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get(':uuid')
  async getTicket(@Param('uuid') uuid: string) {
    return this.ticketsService.findOneByUuid(uuid);
  }
}