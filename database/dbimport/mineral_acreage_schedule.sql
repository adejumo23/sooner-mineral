-- MySQL dump 10.13  Distrib 8.0.29, for Win64 (x86_64)
--
-- Host: localhost    Database: mineral
-- ------------------------------------------------------
-- Server version	8.0.29

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `acreage_schedule`
--

DROP TABLE IF EXISTS `acreage_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acreage_schedule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `buyer` varchar(255) DEFAULT NULL,
  `county` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `str` varchar(255) DEFAULT NULL,
  `legal_description` varchar(255) DEFAULT NULL,
  `interest_type` varchar(255) DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `street` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `zip` varchar(255) DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `phone_no` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `nma` varchar(255) DEFAULT NULL,
  `roy` varchar(255) DEFAULT NULL,
  `nri` varchar(255) DEFAULT NULL,
  `well_name` varchar(255) DEFAULT NULL,
  `allocation` varchar(255) DEFAULT NULL,
  `tops_nma_3_16th` varchar(255) DEFAULT NULL,
  `total` varchar(255) DEFAULT NULL,
  `last_ogl` varchar(255) DEFAULT NULL,
  `title_source` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7817 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acreage_schedule`
--

LOCK TABLES `acreage_schedule` WRITE;
/*!40000 ALTER TABLE `acreage_schedule` DISABLE KEYS */;
INSERT INTO `acreage_schedule` VALUES (7787,'KINGFISHER','NEW','13-16N-07W','NW4 NW4, 40 ACRES, MOL','','','','','','','','','UPDATED','23.333333','','','','','','','','2006 OR',NULL,NULL),(7788,'KINGFISHER','NEW','30-15N-06W','NE4, 160 ACRES, MOL','MINERALS','James M. Patrick and Margarett L. Patrick, H/W JT','P.O. Box 1119','Skiatook','OK','74070','','','Everything has been sold to various pro\'s - 9.30.2024 JMD','80','','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2012 OR',NULL,NULL),(7789,'KINGFISHER','LVM/TXT/EMAIL','30-15N-06W','NE4, 160 ACRES, MOL','MINERALS','Glenna Sue Ahlden','Rt 4 Box 121A','Okarche','OK','73762','gahlden@tivejo.com','405.263.7686 -disc\n405.820.0552 -disc\n734.972.0484 -wrg#','NEED TO UPDATE FROM DATE OF REPORT\n9.30.24- all #s listed aren\'t good; trying email','40','','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2012 OR',NULL,NULL),(7790,'KINGFISHER','LVM/TXT/EMAIL','30-15N-06W','NE4, 160 ACRES, MOL','MINERALS','Donovan Neal Ahlden','121 RR 4','Okarche','OK','73762','dahlden@yahoo.com','405.263.7686 -disc \n405.820.0552 -disc','NEED TO UPDATE FROM DATE OF REPORT\n9.30.24- same #s for Glenna still aren\'t good; trying his email','40','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2012 OR',NULL,NULL),(7791,'KINGFISHER','NEW','30-15N-06W','LOTS 1&2 (82.12); E2 NW4, 162.12','MINERALS','Jimmy D. North and Pamela North, Trustee or their successors in trust, under the Jimmy D. North Living Trust, dated August 15, 2002','5001 NW 4th','Oklahoma City','OK','73127','','','9.30.2024 Current -JMD','81.06','','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2012 OR',NULL,NULL),(7792,'KINGFISHER','NEW','30-15N-06W','LOTS 1&2 (82.12); E2 NW4, 162.12','MINERALS','Robert Roy Joslin & Kay Joslin, H/W - Wake Energy','3611 Fritz Lane','Corinth','TX','76208','','','9.30.2024 Current -JMD','40.53','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2012 OR',NULL,NULL),(7793,'KINGFISHER','LVM/TXT/EMAIL','30-15N-06W','LOTS 1&2 (82.12); E2 NW4, 162.12','MINERALS','Pamela K. Turner','4300 Ryan Dr NE','Piedmont','OK','73078','','(405) 373-2181\n405.826.2404 -good#','9.30.2024 Current -JMD; LVM','40.53','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2012 OR',NULL,NULL),(7794,'KINGFISHER','NEW','30-15N-06W','LOTS 3&4 A/D/A W2 SW4, (81.88); E2 SW4 (80), 161.88 ACRES, MOL','MINERALS','Dolores Meyer Living Trust dated January 27, 1998 Dolores Meyer, Trustee','P. O. Box 433','Okarche','OK','73762','','','9.30.2024 Current -JMD','161.88','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2012 OR',NULL,NULL),(7795,'KINGFISHER','NEW','30-15N-06W','SE4, 160 ACRES, MOL','MINERALS','Robert Henry Schroeder\nLiberty Minerals, LLC','1421 Washington St.','Cedar Falls','IA','50613','','(319) 268-1572','Everything has been sold to various pro\'s - 9.30.2024 JMD','80','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2012 OR',NULL,NULL),(7796,'KINGFISHER','NEW','30-15N-06W','SE4, 160 ACRES, MOL','MINERALS','Donna R. Biggs\nLiberty Minerals, LLC 40.00 NMA\nBroadmoor Land and Minerals, LLC 13.33 NMA\nCommemorative Investments, LLC 13.33 NMA\nCongress Energy Ventures, LLC 13.33 NMA\n','525 Westview Dr.','Yukon','OK','73099','','(405) 577-5176','Everything has been sold to various pro\'s - 9.30.2024 JMD','80','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2012 OR',NULL,NULL),(7797,'KINGFISHER','LVM/TXT/EMAIL','31-15N-06W','NE4, 160 ACRES, MOL','MINERALS','Mary Ann Schaefer','223 Sandra Drive','San Antonio','TX','78223','','210.533.8339','9.30.2024 Current -JMD; LVM','80','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7798,'KINGFISHER','NEW','31-15N-06W','NE4, 160 ACRES, MOL','MINERALS','Rosemary Mueller Lindley\nWake Energy, LLC','5226 Jamaica Beach','Galveston','TX','77554','','','9.30.2024 Current -JMD','80','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7799,'KINGFISHER','NEW','31-15N-06W','LOTS, 1,2; E2 NW4, 161.24 ACRES, MOL','MINERALS','F. Joe Rueter aka Frank Joseph Rueter, Assumed Deceased:\nc/o Donna Shelton','754 CR 262','Mico','TX','78056','','830-612-2958','NEED TO UPDATE FROM DATE OF REPORT','26.873333','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7800,'KINGFISHER','NEW','31-15N-06W','LOTS, 1,2; E2 NW4, 161.24 ACRES, MOL','MINERALS','Annette M. Kuehn nka Annette M. Brandley\nAnnette and Steven Brandley','P. O. Box 279','Okarche','OK','73762','','405-517-3349','9.30.2024 Current -JMD','26.873333','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7801,'KINGFISHER','NEW','31-15N-06W','LOTS, 1,2; E2 NW4, 161.24 ACRES, MOL','MINERALS','The Mary G. Kraus Living Trust, a Revocable Trust dated the 7th day of July, 1997, Mary G. Kraus, Trustee','9500 S Council Road','Oklahoma City','OK','73169','','405-745-4025','9.30.2024 Current -JMD','26.873333','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7802,'KINGFISHER','NEW','31-15N-06W','LOTS, 1,2; E2 NW4, 161.24 ACRES, MOL','MINERALS','James M. Mueggenborg','Route 2, Box 147','Kingfisher','OK','73750','','405-375-3633','NEED TO UPDATE FROM DATE OF REPORT','26.873333','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7803,'KINGFISHER','NEW','31-15N-06W','LOTS, 1,2; E2 NW4, 161.24 ACRES, MOL','MINERALS','John P. Scheirman Living Trust','3305 Windsor Blvd','Oklahoma City','OK','73123','','','9.30.2024 Current -JMD','8.957778','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7804,'KINGFISHER','NEW','31-15N-06W','LOTS, 1,2; E2 NW4, 161.24 ACRES, MOL','MINERALS','Sandra M. Plain\nThe Plain Family Living Trust','5717 Firecrest','Garland','TX','75229','','','9.30.2024 Current -JMD','8.957778','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7805,'KINGFISHER','NEW','31-15N-06W','LOTS, 1,2; E2 NW4, 161.24 ACRES, MOL','MINERALS','Susan M. Scheirman Hiatt','3226 Wilshire Terrace','Oklahoma City','OK','73116','','','NEED TO UPDATE FROM DATE OF REPORT','8.957778','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7806,'KINGFISHER','NEW','31-15N-06W','LOTS, 1,2; E2 NW4, 161.24 ACRES, MOL','MINERALS','Ronald W. Lodes \nc/o Antoinette M. Lodes','505 N 1st','Okarche','OK','73762','','405-263-7714','NEED TO UPDATE FROM DATE OF REPORT','5.374667','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7807,'KINGFISHER','NEW','31-15N-06W','LOTS, 1,2; E2 NW4, 161.24 ACRES, MOL','MINERALS','Paul Michael Lodes \nc/o Antoinette M. Lodes','505 N 1st','Okarche','OK','73762','','405-263-7714','NEED TO UPDATE FROM DATE OF REPORT','5.374667','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7808,'KINGFISHER','NEW','31-15N-06W','LOTS, 1,2; E2 NW4, 161.24 ACRES, MOL','MINERALS','Timothy R. Lodes \nc/o Antoinette M. Lodes','505 N 1st','Okarche','OK','73762','','405-263-7714','NEED TO UPDATE FROM DATE OF REPORT','5.374667','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7809,'KINGFISHER','NEW','31-15N-06W','LOTS, 1,2; E2 NW4, 161.24 ACRES, MOL','MINERALS','Antoinette M. Lodes aka Antoinette Marie Lodes, Life Estate\n\nRemainderman: The Paul Matthew Lodes and Antoinette Marie Lodes Revocable Living Trust Antoinette M. Lodes, Trustees','505 N 1st','Okarche','OK','73762','','405-263-7714','NEED TO UPDATE FROM DATE OF REPORT','5.374667','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7810,'KINGFISHER','NEW','31-15N-06W','LOTS, 1,2; E2 NW4, 161.24 ACRES, MOL','MINERALS','The Donald F. Lodes Revocable Living Trust dated November 23, 1999, c/o Antoinette M. Lodes','505 N 1st','Okarche','OK','73762','','405-263-7714','NEED TO UPDATE FROM DATE OF REPORT','2.687333','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7811,'KINGFISHER','NEW','31-15N-06W','LOTS, 1,2; E2 NW4, 161.24 ACRES, MOL','MINERALS','The Patricia E. Lodes Revocable Living Trust dated November 23, 1999, c/o Antoinette M. Lodes','505 N 1st','Okarche','OK','73762','','405-263-7714','NEED TO UPDATE FROM DATE OF REPORT','2.687333','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7812,'KINGFISHER','NEW','31-15N-06W','N32 ACRES OF THE SW4, 32.044 ACRES, MOL','MINERALS','The Myers Family Trust','801 Greendale Road','Dutch John','UT','84023','','','NEED TO UPDATE FROM DATE OF REPORT','32.044','0.125','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7813,'KINGFISHER','NEW','31-15N-06W','THE E2 & W2 OF THE S128 ACRES OF THE SW4, 125.176 ACRES, MOL','MINERALS','Thomas J. Kroener','106 E Stroh Ave','Okarche','OK','73762','','','NEED TO UPDATE FROM DATE OF REPORT','62.588','0.125','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7814,'KINGFISHER','NEW','31-15N-06W','THE E2 & W2 OF THE S128 ACRES OF THE SW4, 125.176 ACRES, MOL','MINERALS','Karl J. Kroener \nc/o Thomas J. Kroener','106 E Stroh Ave','Okarche','OK','73762','','','NEED TO UPDATE FROM DATE OF REPORT','62.588','0.125','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7815,'KINGFISHER','NEW','31-15N-06W','M&B TRACT IN THE SWC SE4 SW4, 3 ACRES, MOL','MINERALS','The Margaret Eve Kroener Revocable Living Trust dated the 31st day of May, 1991, Margaret Eve Kroener, Trustee - c/o Thomas J. Kroener','106 E Stroh Ave','Okarche','OK','73762','','','NEED TO UPDATE FROM DATE OF REPORT','3','0.125','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL),(7816,'KINGFISHER','NEW','31-15N-06W','SE4, 160 ACRES, MOL','MINERALS','The John F. McCarthy 1998 Revocable Trust dated 3/19/1998, Donna Joann McCarthy, Successor Trustee','12600 Deerwood Drive','Oklahoma City','OK','73142','','','NEED TO UPDATE FROM DATE OF REPORT','160','0.1875','','MCCARTHY 2,3,4,5','50%','$10,000.00 ','','','2011 OR',NULL,NULL);
/*!40000 ALTER TABLE `acreage_schedule` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-06 11:19:14
