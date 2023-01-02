CREATE DATABASE freedb_ZitraDB;
USE freedb_ZitraDB;

CREATE TABLE EmployeeTB(
ID INT(11) NOT NULL PRIMARY KEY,
LastName VARCHAR(30) NOT NULL,
FirstName VARCHAR(30) NOT NULL,
Department varchar(60) NOT NULL,
Role varchar(60) NOT NULL,
TitleOfCourtesy varchar(25) NOT NULL,
BirthDate DATETIME NOT NULL,
HireDate DATETIME NOT NULL,
Address varchar(60) NOT NULL,
City varchar(15) NOT NULL,
Region varchar(15) NOT NULL,
PostalCode varchar(10) NOT NULL,
Country varchar(15) NOT NULL,
Email varchar(50) NOT NULL,
HomePhone varchar(24) NOT NULL,
Extension varchar(4) NOT NULL,
Photo varchar(255) NOT NULL,
Notes longtext NOT NULL,
ReportsTo int(11) NOT NULL,
Username varchar(50) NOT NULL,
Password varchar(50) NOT NULL,
UserLevel int(11) NOT NULL,
CurrentWorkSetup varchar(25) NOT NULL,
CurrentWorkStatus varchar(25) NOT NULL,
WorkStatusChangedTime varchar(25) NOT NULL,
Activated int(11) NOT NULL);

DESC EmployeeTB;

INSERT INTO `freedb_ZitraDB`.`EmployeeTB` (`ID`, `LastName`, `FirstName`, `Department`, `Role`, `TitleOfCourtesy`, `BirthDate`, `HireDate`, `Address`, `City`, `Region`, `PostalCode`, `Country`, `Email`, `HomePhone`, `Extension`, `Photo`, `Notes`, `ReportsTo`, `Username`, `Password`, `UserLevel`, `CurrentWorkStatus`, `CurrentWorkSetup`, `Activated`) VALUES ('99998', 'Admin', 'Zitra', 'Zitra SLT', 'Developer', 'Mr', '2001-10-30', '2022-09-14', 'B1 L11 Ridgemont', 'Taytay, Rizal', 'CALABARZON', '1980', 'Philippines', 'admin@zitra.com', '09215663968', '0921', 'test2.png', 'none', '99999', 'admin101', 'Izukishun@30', '3', 'AVAILABLE', 'Work From Home', '1');

SELECT * FROM EmployeeTB;




CREATE TABLE SwitchGlobalTB(event_id int(11) NOT NULL, event VARCHAR(50) NOT NULL, status INT(11)NOT NULL);

DESC SwitchGlobalTB;

INSERT INTO SwitchGlobalTB VALUES(1, 'Server', 1);

SELECT * FROM SwitchGlobalTB;



-- Manual Changes:

ALTER TABLE EmployeeTB ADD WorkStatusChangedTime varchar(25) NOT NULL AFTER CurrentWorkStatus;


