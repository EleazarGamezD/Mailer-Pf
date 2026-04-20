
import { Client } from 'minio';
import pkg from 'uuid';
import { environments } from '../../core/constants/environments.js';
const { v4: uuidv4 } = pkg;

const fileServices = {
    /**
     * Uploads multiple files to MinIO
     * @param {Array<Object>} files - Array of objects with file data
     * @returns {Promise<Array<string>>} A promise that resolves to an array of file names
     */
    async uploadMultipleFiles(files) {
        const fileNames = [];
        for (const file of files) {
            const fileName = await this.uploadFile(file);
            fileNames.push(fileName);
        }
        return fileNames;
    },

    async uploadFile(file) {
        try {
            const fileName = await this.generateRandomFileName(file.extension);
            const fileBuffer = Buffer.from(file.file, 'base64');
            // Subir a MinIO
            const result = await minioClient.putObject(BUCKET, fileName, fileBuffer);
            if (!result) {
                throw new Error('Failed to upload file to MinIO');
            }
            console.log(`MinIO Response: ${JSON.stringify(result)}`);
            // Retornar el nombre del archivo
            console.log(`File uploaded successfully: ${fileName}`);
            // Return the file name
            // This is useful for storing the file name in the database or returning it to the client
            return fileName;
        } catch (error) {
            console.error("Error uploading file to MinIO:", error);
            throw error;
        }
    },



    /**
     * Retrieves multiple files from a given gallery of file names.
     * 
     * @param {Array<string>} gallery - An array of file names to retrieve.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of file objects. 
     *          Each object contains details about the file if it exists.
     *          If an error occurs or a file is not found, it returns an empty array.
     * @throws Logs an error if there is an issue retrieving files.
     */
    async getGalleryMultipleFiles(gallery) {
        try {
            const files = [];
            // Si gallery es un arreglo de nombres de archivo

            for (const fileName of gallery) {
                const file = await this.getFileByName(fileName);
                if (file) {
                    files.push(file);
                }
            }
            return files;

        } catch (error) {
            console.error("Error getting gallery files:", error);
            return [];
        }
    },

    /**
     * Generates a random file name with the given file extension
     * @param {string} fileExtension - The file extension to use
     * @returns {Promise<string>} A promise that resolves to a random file name
     */
    async generateRandomFileName(fileExtension) {
        const randomName = uuidv4();
        return `${randomName}.${fileExtension}`;
    },

    async deleteMultipleFiles(files) {
        const results = [];
        for (const file of files) {
            const result = await this.deleteFile(file);
            results.push(result);
        }
        return results;
    },

    async deleteFile(fileName) {
        try {
            await minioClient.removeObject(BUCKET, fileName);
            return {
                success: true,
                fileName,
                message: 'Archivo eliminado correctamente'
            };
        } catch (error) {
            console.error("Error deleting file from MinIO:", error);
            return {
                success: false,
                fileName,
                message: 'No se pudo eliminar el archivo',
                error: error.message
            };
        }
    },

    async getFileByName(fileName) {
        try {
            // Validar existencia del archivo antes de firmar la URL
            await minioClient.statObject(BUCKET, fileName);

            // Configurar headers para la URL firmada con soporte CORS
            const reqParams = {
                'response-cache-control': 'max-age=3600',
            };

            // Firmar la URL con parámetros adicionales y tiempo de expiración más largo
            const url = await minioClient.presignedGetObject(
                BUCKET,
                fileName,
                7 * 24 * 60 * 60, // 7 días de expiración
                reqParams
            );

            return {
                name: fileName,
                file: url,
                extension: fileName.split('.').pop()
            };
        } catch (error) {
            if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
                // Archivo no existe
                return null;
            }
            console.error("Error getting file by name from MinIO:", error);
            return null;
        }
    },


    async getFileStream(fileName) {
        try {
            // Validar existencia del archivo
            const stats = await minioClient.statObject(BUCKET, fileName);
            // Obtener el stream del archivo
            const stream = await minioClient.getObject(BUCKET, fileName);
            return {
                stream,
                contentType: stats.metaData['content-type'] || this.getContentTypeFromExtension(fileName),
                size: stats.size
            };
        } catch (error) {
            if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
                return null;
            }
            console.error("Error getting file stream from MinIO:", error);
            throw error;
        }
    },

};

export default fileServices;