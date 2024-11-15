import { Injectable } from '@nestjs/common';
import { ResponseDTO } from '../../core/response.dto';
import { Article } from '../article.dto';
import { HelperService } from '../../core/helper-service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';

@Injectable()
export class ArticleService {

    public constructor(
        @InjectRepository(Article) 
        private readonly repository : Repository<Article> 
    ) {}

    getAll() : Promise<ResponseDTO<Article[]>> {
        return this.repository.find().then((data) => {
            return HelperService.performResponse("200", "La liste des articles a été récupérés avec succès", data);
        });
    }

    async getById(id: string) : Promise<ResponseDTO<Article>> {

        const foundArticle = await this.repository.findOne({ where : {_id : new ObjectId(id)}});

        // Si je trouve pas (si undefined ou null)
        if (!foundArticle){
            return HelperService.performResponse("702", `Impossible de récupérer un article avec l'UID ${id}`, null);
        }

        return HelperService.performResponse("200", "Article récupéré avec succès", foundArticle);
    }

    async save(article: Article) : Promise<ResponseDTO<Article>> {
        // Creation ou Edition ?
        // ==========================================================
        // Update
        // ==========================================================
        if (article._id) {
            let foundArticle = await this.repository.findOne({ where : {_id : article._id }});

            if (foundArticle){

                // Est-ce que le titre existe deja sauf le miens
                const foundArticleTitleList = await this.repository.find({ where : {title :  article.title}});

                const foundArticleTitle = foundArticleTitleList.find((value) => value._id != article._id);

                if (foundArticleTitle) {
                    return HelperService.performResponse("701 ", "Impossible de modifier un article avec un titre déjà existant", article);
                }

                // Ecraser les données id
                foundArticle.title = article.title;
                foundArticle.content = article.content;

                // attendre que le save se termine
                await this.repository.save(foundArticle);

                return HelperService.performResponse("200", "Article modifié avec succès", foundArticle);
            }
        }

        // ==========================================================
        // Creation
        // ==========================================================
        // est-ce que le titre existe deja
        const foundArticleTitle = await this.repository.findOne({ where : {title :  article.title}});

        if (foundArticleTitle) {
            return HelperService.performResponse("701 ", "Impossible d'ajouter un article avec un titre déjà existant", article);
        }

        // Success
        await this.repository.save(article);

        return HelperService.performResponse("200", "Article ajouté avec succès", article);
    }
    
    async deleteById(id: string) : Promise<ResponseDTO<Article>> {
        
        // Essayer de trovuer l'index d'un tableau selon un critère de recherche
        const foundArticle = await this.repository.findOne({ where : {_id : new ObjectId(id)}});

        // Si je trouve pas (si undefined ou null)
        if (!foundArticle){
            return HelperService.performResponse("702", `Impossible de supprimer un article dont l'UID n'existe pas`, null);
        }

        // Stocker en mémoire avant suppression et supprimer l'article
        await this.repository.delete(foundArticle);
    
        return HelperService.performResponse("200", `L'article ${id} a été supprimé avec succès`, foundArticle);
    }
}
