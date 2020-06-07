import { Request, Response } from 'express';
import knex from '../database/connection';

class ItemController {
    async index(request: Request, response: Response) {
        const items = await knex("items").select("*");
    
        const serializedItems = items.map(item => {
            return {
                id: item.id,
                image_url: `http://192.168.0.109:3333/uploads/${item.image}`,
                title: item.title
            }
        })
    
        return response.json(serializedItems);
    }
}

export default ItemController;
