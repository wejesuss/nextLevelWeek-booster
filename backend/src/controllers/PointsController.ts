import { Request, Response } from 'express';
import knex from '../database/connection';

class PointsController {
    async index(request: Request, response: Response) {
        let { city, uf, items } = request.query;

        if(!items) {
            let allItems = await knex("items").select("id")
            allItems = allItems?.map((item: Item) => item.id);

            items = allItems
        }

        const parsedItems = String(items)
        .split(",")
        .map(item => Number(item.trim()));

        let points = await knex("points")

        if(city && uf) {
            points = await knex("points").join("point_items", "points.id", "=", "point_items.point_id")
            .whereIn("point_items.item_id", parsedItems)
            .where("points.city", String(city))
            .where("points.uf", String(uf).toUpperCase())
            .distinct()
            .select("points.*")
        }
        
        return response.json(points);
    }

    async create(request: Request, response: Response) {
        try {
            let {
                name,
                email,
                whatsapp,
                latitude,
                longitude,
                city,
                uf,
                items
            } = request.body

            uf = uf.toUpperCase();
    
            const trx = await knex.transaction();
    
            const point = {
                image: "https://images.unsplash.com/photo-1506484381205-f7945653044d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=480&q=60",
                name,
                email,
                whatsapp,
                latitude,
                longitude,
                city,
                uf
            }
    
            const insertedIds = await trx("points").insert(point);
            const point_id = insertedIds[0]
    
            const pointItems = items.map((item_id: number) => {
                return {
                    item_id,
                    point_id
                }
            })
            

            try {
                await trx("point_items").insert(pointItems);
                await trx.commit();
            } catch (err) {
                console.error(err)
                await trx.rollback(err);
                return response.status(404)
                .json({
                    message: 'Insertion in table point_items failed, verify if the informed data are valid',
                    error: err
                })
            }
    
            return response.json({
                id: point_id,
                ...point
            });
        } catch (error) {
            console.error(error)
            return response.status(404)
            .json({
                message: 'Insertion in table point_items failed, verify if the informed data are valid',
                error
            })
        }
    }
    
    async show(request: Request, response: Response) {
        const { id } = request.params

        const point = await knex("points").select("*").where("id", Number(id)).first();
        
        if(!point) {
            return response.status(400).json({ message: "Point not found"})
        }

        const items = await knex("items")
        .join("point_items", 'items.id', '=', 'point_items.item_id')
        .where("point_items.point_id", id)
        .select("items.title")

        return response.json({ point, items });
    }
}

export default PointsController;