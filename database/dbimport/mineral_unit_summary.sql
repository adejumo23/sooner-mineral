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
-- Table structure for table `unit_summary`
--

DROP TABLE IF EXISTS `unit_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unit_summary` (
  `Tier/Class` text,
  `Well Name` text,
  `ALLO%` text,
  `Operator` text,
  `Status` text,
  `S` text,
  `T` text,
  `R` text,
  `County` text,
  `Well Status` text,
  `1st Pro` text,
  `Comp` text,
  `Spud` text,
  `OCC ACTIVITY NOTES` text,
  `Tops @ 3/16th` text,
  `CLOSED` text,
  `NEGO` text,
  `Mailers` text,
  `LVM/TXT/EMAIL` text,
  `WTL` text,
  `Dropped` text,
  `# of Owners` text,
  `INTERNAL NOTES` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unit_summary`
--

LOCK TABLES `unit_summary` WRITE;
/*!40000 ALTER TABLE `unit_summary` DISABLE KEYS */;
INSERT INTO `unit_summary` VALUES ('AOI','CONDIT','0.479510','CLR','ACTIVELY WORKING','S05','02S','03W','CARTER','ORDER','','','','',' $ 12,000.00 ','1','1','0','0','1','0','3',''),('AOI','GALVIN','0.625000','CLR','WORKED/FOLLOW UP','S22','06N','05W','GRADY','PERMITTED','','','','',' $ 11,000.00 ','1','0','0','1','0','1','3',''),('RAN/POT','GAPSTOW','0.393510','OVINTIV','NEXT TO ASSIGN','S07','08N','04W','MCCLAIN','DRILLING','','','','',' $ 7,500.00 ','1','0','0','0','1','1','3',''),('AOI - Tier 2','CHELSEA','0.500000','CLR','SENDING MAILERS','S01','02S','03W','CARTER','APPLICATION','','','','',' $ 12,000.00 ','1','1','0','1','0','0','3',''),('AOI','CONCHO','0.512950','MARATHON','TBD/WAITING ON $','S03','03N','04W','MCCLAIN','DUC','','','','',' $ -   ','0','0','0','1','1','1','3','');
/*!40000 ALTER TABLE `unit_summary` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-06 11:19:13
